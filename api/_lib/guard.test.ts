import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWTVerifyGetKey } from 'jose';
import { HttpError, MAX_BODY_BYTES, parseAllowedEmails, readProjectBody, requireAllowedUser } from './guard';
import { serializeProject } from '../../src/utils/projectFile';
import { makeRectRoom } from '../../src/test/factories';

type Key = Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];

const ALLOWED = ['ana@example.com'];
let privateKey: Key;
let jwks: JWTVerifyGetKey;
let otherKey: Key;

beforeAll(async () => {
  const pair = await generateKeyPair('EdDSA');
  privateKey = pair.privateKey;
  jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), alg: 'EdDSA' }] });
  otherKey = (await generateKeyPair('EdDSA')).privateKey;
});

function makeToken(claims: Record<string, unknown> = {}, key: Key = privateKey, expiresIn = '15m') {
  return new SignJWT({ email: 'ana@example.com', emailVerified: true, ...claims })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setExpirationTime(expiresIn)
    .sign(key);
}

function makeRequest(token?: string, body?: string) {
  return new Request('https://app.test/api/projects', {
    method: body === undefined ? 'GET' : 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  });
}

async function statusOf(promise: Promise<unknown>): Promise<number | 'ok'> {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    if (error instanceof HttpError) return error.status;
    throw error;
  }
}

describe('parseAllowedEmails', () => {
  it('trims, lower-cases and drops blanks', () => {
    expect(parseAllowedEmails(' A@x.com, b@y.com ,')).toEqual(['a@x.com', 'b@y.com']);
  });

  it('is empty when the variable is unset', () => {
    expect(parseAllowedEmails(undefined)).toEqual([]);
  });
});

describe('requireAllowedUser', () => {
  it('[FDD-0008 / AC-05] rejects a request without a token with 401', async () => {
    const request = makeRequest();

    const status = await statusOf(requireAllowedUser(request, jwks, ALLOWED));

    expect(status).toBe(401);
  });

  it('[FDD-0008 / AC-05] rejects a token signed by another key with 401', async () => {
    const request = makeRequest(await makeToken({}, otherKey));

    const status = await statusOf(requireAllowedUser(request, jwks, ALLOWED));

    expect(status).toBe(401);
  });

  it('[FDD-0008 / AC-05] rejects an expired token with 401', async () => {
    const request = makeRequest(await makeToken({}, privateKey, '-1m'));

    const status = await statusOf(requireAllowedUser(request, jwks, ALLOWED));

    expect(status).toBe(401);
  });

  it('[FDD-0008 / AC-04] rejects a verified email that is not on the list with 403', async () => {
    const request = makeRequest(await makeToken({ email: 'stranger@example.com' }));

    const status = await statusOf(requireAllowedUser(request, jwks, ALLOWED));

    expect(status).toBe(403);
  });

  it('[FDD-0008 / AC-04] rejects an allowed email that is not verified with 403', async () => {
    const request = makeRequest(await makeToken({ emailVerified: false }));

    const status = await statusOf(requireAllowedUser(request, jwks, ALLOWED));

    expect(status).toBe(403);
  });

  it('accepts an allowed, verified email regardless of case', async () => {
    const request = makeRequest(await makeToken({ email: 'Ana@Example.com' }));

    const email = await requireAllowedUser(request, jwks, ALLOWED);

    expect(email).toBe('ana@example.com');
  });
});

describe('readProjectBody', () => {
  const file = () =>
    serializeProject('Casa', [{ name: 'Opção 1', plan: { rooms: [makeRectRoom(0, 0, 400, 300)], objects: [], dimensionLines: [] } }], 0);

  it('[FDD-0008 / INV-02] returns the name and a normalised project file', async () => {
    const sent = file();
    const request = makeRequest('t', JSON.stringify({ ...sent, extra: 'dropped' }));

    const { name, data } = await readProjectBody(request);

    expect(name).toBe('Casa');
    expect(data).toEqual(sent);
  });

  it('[FDD-0008 / INV-02] rejects malformed JSON with 400', async () => {
    const status = await statusOf(readProjectBody(makeRequest('t', '{not json')));

    expect(status).toBe(400);
  });

  it('[FDD-0008 / INV-02] rejects a file with an invalid active option with 400', async () => {
    const status = await statusOf(readProjectBody(makeRequest('t', JSON.stringify({ ...file(), activeOption: 5 }))));

    expect(status).toBe(400);
  });

  it('rejects a body larger than the limit with 413', async () => {
    const status = await statusOf(readProjectBody(makeRequest('t', 'x'.repeat(MAX_BODY_BYTES + 1))));

    expect(status).toBe(413);
  });
});

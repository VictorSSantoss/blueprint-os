/**
 * Request checks shared by every API route — FDD-0008.
 *
 * @remarks
 * Pure functions with the key set and allow-list injected, so they run in tests without
 * network or database. Routes call them before any query (FDD-0008 INV-01).
 */

import { jwtVerify, type JWTVerifyGetKey } from 'jose';
import { parseProjectFile, serializeProject, type ProjectFile } from '../../src/utils/projectFile.js';
import { translations } from '../../src/i18n/translations.js';

/** Largest accepted request body; a plan for one house is a few tens of kB. */
export const MAX_BODY_BYTES = 1_000_000;

/** An error that becomes an HTTP response with the given status. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Reads the allow-list from its environment variable.
 *
 * @param raw - Comma-separated emails, e.g. the value of `ALLOWED_EMAILS`.
 * @returns Trimmed, lower-case emails; empty when the variable is unset.
 * @example
 * parseAllowedEmails(' A@x.com, b@y.com ,') // → ['a@x.com', 'b@y.com']
 */
export function parseAllowedEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifies the caller's Neon Auth token and allow-list membership.
 *
 * @remarks
 * Neon Auth also allows email/password sign-up without verification, so anyone could
 * register an allowed address they do not own. Only verified emails (Google sign-in
 * always is) pass.
 *
 * @param request - Incoming request with an `Authorization: Bearer <jwt>` header.
 * @param getKey - Neon Auth key set (`createRemoteJWKSet` in production).
 * @param allowed - Lower-case allowed emails.
 * @returns The caller's email, lower-case.
 * @throws {HttpError} 401 when the token is missing or invalid; 403 when the email is unverified or not allowed.
 */
export async function requireAllowedUser(
  request: Request,
  getKey: JWTVerifyGetKey,
  allowed: readonly string[]
): Promise<string> {
  const token = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) throw new HttpError(401, 'Missing token');

  let payload: Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(token, getKey));
  } catch {
    throw new HttpError(401, 'Invalid token');
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
  if (!email || payload.emailVerified !== true || !allowed.includes(email)) {
    throw new HttpError(403, 'Email not allowed');
  }
  return email;
}

/**
 * Reads and validates a project file sent by the app.
 *
 * @remarks
 * The stored value is re-serialised from the parsed result, so every row passes
 * `parseProjectFile` (FDD-0008 INV-02).
 *
 * @param request - Request whose body is a version 1.1 project file.
 * @returns The project name and the normalised file to store.
 * @throws {HttpError} 413 when the body exceeds {@link MAX_BODY_BYTES}; 400 when it is not a valid project file.
 */
export async function readProjectBody(request: Request): Promise<{ name: string; data: ProjectFile }> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new HttpError(413, 'Body too large');
  try {
    const { name, options, activeOption } = parseProjectFile(
      JSON.parse(text),
      translations['pt-BR'].defaultOptionName
    );
    return { name, data: serializeProject(name, options, activeOption) };
  } catch {
    throw new HttpError(400, 'Invalid project file');
  }
}

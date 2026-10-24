import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Stores read window.location and window.localStorage at import; the 'online' event needs an EventTarget.
vi.hoisted(() => {
  const localStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
  Object.assign(globalThis, { window: Object.assign(new EventTarget(), { location: { search: '', href: '' }, localStorage }) });
});

import { makeRectRoom } from '../test/factories';
import { useProjectStore } from './projectStore';
import { useTabsStore } from './tabsStore';
import { useCloudStore } from './cloudStore';
import { replaceAllTabs } from './tabs';
import { serializeProject } from '../utils/projectFile';
import {
  CLOUD_RETRY_MS,
  CLOUD_SAVE_DEBOUNCE_MS,
  detachCloudProject,
  initCloud,
  openCloudProject,
  startCloudSync,
} from './cloudSync';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../lib/auth', () => ({ authClient: auth }));

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const NEW_ID = '22222222-2222-4222-8222-222222222222';

interface Call {
  method: string;
  path: string;
  body?: unknown;
}

let calls: Call[];
let reply: (call: Call) => Response | Promise<Response>;
let stop: () => void;

const json = (body: unknown, status = 200) => Response.json(body, { status });
const addRoom = () => useProjectStore.setState((s) => ({ rooms: [...s.rooms, makeRectRoom(0, 0, 400, 300)] }));
const settle = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
};

function makeCloudRow(name = 'Casa na nuvem') {
  const plan = { rooms: [makeRectRoom(0, 0, 500, 500)], objects: [], dimensionLines: [] };
  return { id: PROJECT_ID, name, updatedAt: '2026-10-23T12:00:00Z', data: serializeProject(name, [{ name: 'Opção 1', plan }], 0) };
}

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  reply = () => json({ id: PROJECT_ID });
  vi.stubGlobal('fetch', async (path: string, init: RequestInit = {}) => {
    const call = { method: init.method ?? 'GET', path, body: init.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return reply(call);
  });
  auth.getSession.mockResolvedValue({ data: { user: { email: 'ana@example.com' }, session: { token: 'jwt' } } });
  auth.signOut.mockReset();

  replaceAllTabs([{ name: 'Opção 1', plan: { rooms: [], objects: [], dimensionLines: [] } }], 0);
  useProjectStore.setState({ name: 'Casa' });
  useCloudStore.setState({ email: 'ana@example.com', projectId: PROJECT_ID, dirty: false, status: 'idle' });
  stop = startCloudSync();
});

afterEach(() => {
  stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('autosave', () => {
  it('[FDD-0008 / AC-02] saves the plan 2 seconds after the last change', async () => {
    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS - 1);
    expect(calls).toHaveLength(0);

    await settle(1);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: 'PUT', path: `/api/projects/${PROJECT_ID}`, body: { name: 'Casa' } });
    expect((calls[0].body as { rooms: unknown[] }).rooms).toHaveLength(1);
    expect(useCloudStore.getState()).toMatchObject({ status: 'saved', dirty: false });
  });

  it('[FDD-0008 / OBJ-03] joins a burst of changes into one save', async () => {
    addRoom();
    await settle(1000);
    addRoom();
    await settle(1000);
    addRoom();

    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls).toHaveLength(1);
    expect((calls[0].body as { rooms: unknown[] }).rooms).toHaveLength(3);
  });

  it('sends the access token', async () => {
    const seen: (string | null)[] = [];
    vi.stubGlobal('fetch', async (_path: string, init: RequestInit) => {
      seen.push(new Headers(init.headers).get('authorization'));
      return json({ id: PROJECT_ID });
    });

    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(seen).toEqual(['Bearer jwt']);
  });

  it('does not save while signed out, but remembers the change', async () => {
    useCloudStore.setState({ email: null });

    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls).toHaveLength(0);
    expect(useCloudStore.getState().dirty).toBe(true);
  });

  it('[FDD-0008 / OBJ-06] creates a cloud project for a plan that has none yet', async () => {
    useCloudStore.setState({ projectId: null });
    reply = () => json({ id: NEW_ID }, 201);

    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls.map((c) => c.method)).toEqual(['POST']);
    expect(useCloudStore.getState().projectId).toBe(NEW_ID);
  });

  it('does not create a cloud project for an empty plan', async () => {
    useCloudStore.setState({ projectId: null });

    useProjectStore.setState({ name: 'Só o nome' });
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls).toHaveLength(0);
  });

  it('creates the project again when it was deleted elsewhere', async () => {
    reply = (call) => (call.method === 'PUT' ? json({ error: 'Not found' }, 404) : json({ id: NEW_ID }, 201));

    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls.map((c) => c.method)).toEqual(['PUT', 'POST']);
    expect(useCloudStore.getState().projectId).toBe(NEW_ID);
  });

  it('[FDD-0008 / NON-01] after detaching, the next save creates a new project instead of overwriting', async () => {
    reply = () => json({ id: NEW_ID }, 201);

    detachCloudProject();
    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(calls.map((c) => c.method)).toEqual(['POST']);
  });
});

describe('offline', () => {
  it('[FDD-0008 / AC-06] keeps the change and saves it when the connection returns', async () => {
    reply = () => Promise.reject(new TypeError('Failed to fetch'));
    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);
    expect(useCloudStore.getState()).toMatchObject({ status: 'offline', dirty: true });

    reply = () => json({ id: PROJECT_ID });
    window.dispatchEvent(new Event('online'));
    await settle(0);

    expect(calls.map((c) => c.method)).toEqual(['PUT', 'PUT']);
    expect(useCloudStore.getState()).toMatchObject({ status: 'saved', dirty: false });
  });

  it('[FDD-0008 / AC-06] retries on its own after a server error', async () => {
    reply = () => json({ error: 'Server error' }, 500);
    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);
    reply = () => json({ id: PROJECT_ID });

    await settle(CLOUD_RETRY_MS);

    expect(calls).toHaveLength(2);
    expect(useCloudStore.getState().status).toBe('saved');
  });
});

describe('access', () => {
  it('[FDD-0008 / AC-04] signs out and shows no access when the API answers 403', async () => {
    reply = () => json({ error: 'Email not allowed' }, 403);

    addRoom();
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(useCloudStore.getState()).toMatchObject({ email: null, status: 'denied' });
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('[FDD-0008 / AC-04] checks access right after sign-in, even with nothing to save', async () => {
    useCloudStore.setState({ email: null, projectId: null });
    reply = () => json({ error: 'Email not allowed' }, 403);

    await initCloud();

    expect(useCloudStore.getState().status).toBe('denied');
  });
});

describe('loading', () => {
  it('[FDD-0008 / AC-03] opens a cloud project with every option and does not save it back', async () => {
    reply = () => json(makeCloudRow());

    await openCloudProject(PROJECT_ID);
    await settle(CLOUD_SAVE_DEBOUNCE_MS);

    expect(useProjectStore.getState().name).toBe('Casa na nuvem');
    expect(useProjectStore.getState().rooms).toHaveLength(1);
    expect(useTabsStore.getState().tabs.map((t) => t.name)).toEqual(['Opção 1']);
    expect(calls.map((c) => c.method)).toEqual(['GET']);
    expect(useCloudStore.getState()).toMatchObject({ projectId: PROJECT_ID, dirty: false });
  });

  it('at startup, loads the cloud copy when the browser has no unsent changes', async () => {
    const row = makeCloudRow('Mudado em outro computador');
    reply = (call) => json(call.path === '/api/projects' ? [row] : row);

    await initCloud();

    expect(useProjectStore.getState().name).toBe('Mudado em outro computador');
  });

  it('[FDD-0008 / OBJ-06] at startup, uploads unsent browser changes instead of loading', async () => {
    addRoom();
    stop();
    reply = (call) => json(call.path === '/api/projects' ? [] : { id: PROJECT_ID });

    await initCloud();

    expect(calls.map((c) => c.method)).toEqual(['GET', 'PUT']);
    expect(useProjectStore.getState().rooms).toHaveLength(1);
  });

  it('at startup, uploads the browser copy again when the cloud project was deleted elsewhere', async () => {
    useProjectStore.setState({ rooms: [makeRectRoom(0, 0, 400, 300)] });
    useCloudStore.setState({ dirty: false });
    reply = (call) =>
      call.method === 'GET' ? json([]) : call.method === 'PUT' ? json({ error: 'Not found' }, 404) : json({ id: NEW_ID }, 201);

    await initCloud();

    expect(calls.map((c) => c.method)).toEqual(['GET', 'PUT', 'POST']);
    expect(useCloudStore.getState().projectId).toBe(NEW_ID);
  });
});

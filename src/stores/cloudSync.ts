/**
 * Cloud projects — FDD-0008.
 *
 * @remarks
 * Like undo (FDD-0006), one subscriber watches the project and tab stores instead of every
 * action saving. Any change marks the project dirty and schedules a save; the dirty flag is
 * persisted, so a reload knows whether the browser or the cloud holds the newer copy.
 */

import { authClient } from '../lib/auth';
import { useProjectStore } from './projectStore';
import { useTabsStore } from './tabsStore';
import { useSettingsStore } from './settingsStore';
import { useCloudStore, type CloudStatus } from './cloudStore';
import { isPlanEmpty, optionsForSave, replaceAllTabs } from './tabs';
import { parseProjectFile, serializeProject } from '../utils/projectFile';

/** Quiet time after the last change before saving (FDD-0008 OBJ-03). */
export const CLOUD_SAVE_DEBOUNCE_MS = 2000;
/** Wait before retrying a failed save; the browser's `online` event retries sooner. */
export const CLOUD_RETRY_MS = 15000;

/** A cloud project as listed in *Meus projetos*. */
export interface CloudProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

class Rejected extends Error {}

let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let isLoading = false;

const setStatus = (status: CloudStatus) => useCloudStore.setState({ status });

function projectJson(): string {
  const { options, activeOption } = optionsForSave();
  return JSON.stringify(serializeProject(useProjectStore.getState().name, options, activeOption));
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  // Neon's adapter replaces session.token with the signed JWT the API verifies.
  const token = (await authClient?.getSession())?.data?.session.token;
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  if (response.status === 401 || response.status === 403) {
    useCloudStore.setState({ email: null, status: response.status === 403 ? 'denied' : 'idle' });
    if (response.status === 403) await authClient?.signOut();
    throw new Rejected();
  }
  return response;
}

async function idOf(response: Response): Promise<string> {
  const body: unknown = await response.json();
  const id = typeof body === 'object' && body !== null ? (body as { id?: unknown }).id : undefined;
  if (typeof id !== 'string') throw new Error('Cloud response without project id');
  return id;
}

function schedule(delay = CLOUD_SAVE_DEBOUNCE_MS): void {
  clearTimeout(timer);
  if (useCloudStore.getState().email) timer = setTimeout(() => void saveNow(), delay);
}

/**
 * Sends the plan to the cloud now if it has unsent changes.
 *
 * @remarks
 * Without a cloud project yet, an all-empty plan is not uploaded, so a new browser does not
 * create blank projects. A missing project (deleted elsewhere) is created again. Failures
 * leave the plan dirty and retry after {@link CLOUD_RETRY_MS}.
 */
export async function saveNow(): Promise<void> {
  clearTimeout(timer);
  const { email, projectId, dirty } = useCloudStore.getState();
  if (!email || !dirty) return;
  if (inFlight) return schedule();
  if (!projectId && optionsForSave().options.every((o) => isPlanEmpty(o.plan))) return;

  const body = projectJson();
  inFlight = true;
  setStatus('saving');
  try {
    let response = projectId ? await call(`/api/projects/${projectId}`, { method: 'PUT', body }) : undefined;
    if (!response || response.status === 404) response = await call('/api/projects', { method: 'POST', body });
    if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`);
    const changedMeanwhile = projectJson() !== body;
    useCloudStore.setState({ projectId: await idOf(response), dirty: changedMeanwhile, status: 'saved' });
    if (changedMeanwhile) schedule();
  } catch (error) {
    if (error instanceof Rejected) return;
    setStatus('offline');
    schedule(CLOUD_RETRY_MS);
  } finally {
    inFlight = false;
  }
}

/**
 * Starts watching the plan for changes to save.
 *
 * @returns A function that stops watching.
 */
export function startCloudSync(): () => void {
  const onChange = () => {
    if (isLoading) return;
    const { email } = useCloudStore.getState();
    // While a save is pending the header must not keep claiming the plan is saved.
    useCloudStore.setState(email ? { dirty: true, status: 'saving' } : { dirty: true });
    schedule();
  };
  const onOnline = () => schedule(0);
  const stopProject = useProjectStore.subscribe(onChange);
  const stopTabs = useTabsStore.subscribe(onChange);
  window.addEventListener('online', onOnline);
  return () => {
    stopProject();
    stopTabs();
    window.removeEventListener('online', onOnline);
    clearTimeout(timer);
  };
}

/**
 * Lists every cloud project, most recently changed first.
 *
 * @returns Project summaries.
 * @throws {Error} When the cloud cannot be reached or answers with an unexpected shape.
 */
export async function listCloudProjects(): Promise<CloudProjectSummary[]> {
  const response = await call('/api/projects');
  const body: unknown = await response.json();
  if (!response.ok || !Array.isArray(body)) throw new Error(`Cloud list failed: ${response.status}`);
  return body.filter(
    (p): p is CloudProjectSummary =>
      typeof p?.id === 'string' && typeof p?.name === 'string' && typeof p?.updatedAt === 'string'
  );
}

/**
 * Replaces the plan on screen with a cloud project.
 *
 * @remarks
 * Pending changes to the current project are sent first. Loading does not mark the plan dirty.
 *
 * @param id - Cloud project id.
 * @throws {Error} When the cloud cannot be reached or the stored file is invalid.
 */
export async function openCloudProject(id: string): Promise<void> {
  await saveNow();
  const response = await call(`/api/projects/${id}`);
  if (!response.ok) throw new Error(`Cloud load failed: ${response.status}`);
  const row: unknown = await response.json();
  const data = typeof row === 'object' && row !== null ? (row as { data?: unknown }).data : undefined;
  const { name, options, activeOption } = parseProjectFile(data, useSettingsStore.getState().t('defaultOptionName'));
  isLoading = true;
  try {
    replaceAllTabs(options, activeOption);
    useProjectStore.getState().setProjectName(name);
  } finally {
    isLoading = false;
  }
  useCloudStore.setState({ projectId: id, dirty: false, status: 'saved' });
}

/**
 * Makes the next save create a new cloud project instead of overwriting the current one.
 *
 * @remarks
 * Called before *Novo projeto* and before opening a JSON file.
 */
export function detachCloudProject(): void {
  clearTimeout(timer);
  useCloudStore.setState({ projectId: null, status: 'idle' });
}

/**
 * Picks up an existing sign-in at startup (FDD-0008 OBJ-06).
 *
 * @remarks
 * The access check runs first, so a user not on the allow-list sees the message right after
 * signing in (AC-04). Then the newer copy wins: unsent browser changes are uploaded, otherwise
 * the cloud copy is loaded, since another computer may have changed it. A project deleted
 * elsewhere is uploaded again from the browser copy.
 */
export async function initCloud(): Promise<void> {
  if (!authClient) return;
  try {
    const { data } = await authClient.getSession();
    if (!data?.user.email) return;
    useCloudStore.setState({ email: data.user.email });
    const projects = await listCloudProjects();
    const { projectId, dirty } = useCloudStore.getState();
    if (projectId && !dirty && projects.some((p) => p.id === projectId)) return await openCloudProject(projectId);
    useCloudStore.setState({ dirty: true });
    await saveNow();
  } catch (error) {
    if (error instanceof Rejected) return;
    setStatus('offline');
    schedule(CLOUD_RETRY_MS);
  }
}

/** Starts Google sign-in; the browser leaves the app and returns to it afterwards. */
export async function signIn(): Promise<void> {
  await authClient?.signIn.social({ provider: 'google', callbackURL: window.location.href });
}

/** Sends pending changes, then signs out. The plan stays in the browser. */
export async function signOut(): Promise<void> {
  await saveNow();
  await authClient?.signOut();
  useCloudStore.setState({ email: null, status: 'idle' });
}

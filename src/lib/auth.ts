import { createAuthClient } from '@neondatabase/auth';

const url = import.meta.env.VITE_NEON_AUTH_URL;

/**
 * Neon Auth client for Google sign-in (FDD-0008).
 *
 * @remarks
 * Null when the deployment has no auth URL, in which case the app runs browser-only.
 */
export const authClient = url ? createAuthClient(url) : null;

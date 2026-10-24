/**
 * Wiring of the shared guard to the deployment's environment — FDD-0008.
 */

import { createRemoteJWKSet } from 'jose';
import { neon } from '@neondatabase/serverless';
import { HttpError, parseAllowedEmails, requireAllowedUser } from './guard.js';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const jwks = createRemoteJWKSet(new URL(env('NEON_AUTH_JWKS_URL')));
const allowed = parseAllowedEmails(env('ALLOWED_EMAILS'));

/** Postgres client; the connection string never leaves the server. */
export const sql = neon(env('DATABASE_URL'));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reads the project id from the path, e.g. `/api/projects/<id>`.
 *
 * @param request - Incoming request.
 * @returns The id.
 * @throws {HttpError} 404 when the last path segment is not a UUID.
 */
export function projectIdOf(request: Request): string {
  const id = new URL(request.url).pathname.split('/').pop() ?? '';
  if (!UUID.test(id)) throw new HttpError(404, 'Not found');
  return id;
}

/**
 * Wraps a route handler with the auth and allow-list guard and error mapping.
 *
 * @param handler - Runs only for allowed users; receives the caller's email.
 * @returns A Vercel web handler.
 */
export function route(handler: (request: Request, email: string) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request, await requireAllowedUser(request, jwks, allowed));
    } catch (error) {
      if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
      console.error(error);
      return Response.json({ error: 'Server error' }, { status: 500 });
    }
  };
}

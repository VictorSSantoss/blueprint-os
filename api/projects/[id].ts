import { HttpError, readProjectBody } from '../_lib/guard.js';
import { projectIdOf, route, sql } from '../_lib/route.js';

export const GET = route(async (request) => {
  const [row] = await sql`
    select id, name, data, updated_at as "updatedAt" from projects where id = ${projectIdOf(request)}`;
  if (!row) throw new HttpError(404, 'Not found');
  return Response.json(row);
});

export const PUT = route(async (request) => {
  const id = projectIdOf(request);
  const { name, data } = await readProjectBody(request);
  const [row] = await sql`
    update projects set name = ${name}, data = ${JSON.stringify(data)}::jsonb, updated_at = now()
    where id = ${id} returning id, updated_at as "updatedAt"`;
  if (!row) throw new HttpError(404, 'Not found');
  return Response.json(row);
});

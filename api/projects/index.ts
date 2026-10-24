import { readProjectBody } from '../_lib/guard.js';
import { route, sql } from '../_lib/route.js';

export const GET = route(async () => {
  const rows = await sql`select id, name, updated_at as "updatedAt" from projects order by updated_at desc`;
  return Response.json(rows);
});

export const POST = route(async (request, email) => {
  const { name, data } = await readProjectBody(request);
  const [row] = await sql`
    insert into projects (name, data, created_by)
    values (${name}, ${JSON.stringify(data)}::jsonb, ${email})
    returning id, updated_at as "updatedAt"`;
  return Response.json(row, { status: 201 });
});

-- Cloud projects (FDD-0008). Run once in the Neon SQL Editor on the production branch.
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  data        jsonb not null,          -- version 1.1 project file (FDD-0007)
  created_by  text not null,           -- email of the creator
  updated_at  timestamptz not null default now()
);

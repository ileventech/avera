-- Schema for Projects module (Projects, Buildings, Lands, Blocks, etc.)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Project' check (type in ('Project', 'Building', 'Land', 'Block', 'Other')),
  status text not null default 'Planning' check (status in ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  location text not null default '',
  budget numeric(15,2) not null default 0.00,
  manager text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: Authenticated users can read/write projects
alter table projects enable row level security;
create policy "projects_auth" on projects
  for all using (auth.uid() is not null);

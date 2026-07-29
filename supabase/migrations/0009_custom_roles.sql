-- Custom roles table for organization-defined roles beyond the 7 built-in roles.
-- Administrators can create custom roles with specific module access configurations.

create table if not exists custom_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  target_audience text not null default '',
  badge_color text not null default '#475569',
  badge_bg text not null default '#F1F5F9',
  data_scope text not null default 'All' check (data_scope in ('All', 'Personal')),
  allowed_paths jsonb not null default '[]',
  allowed_modules jsonb not null default '[]',
  restricted_modules jsonb not null default '[]',
  criteria jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists custom_roles_name_idx on custom_roles(name);

-- Only authenticated users can read/write custom roles
alter table custom_roles enable row level security;
create policy "custom_roles_auth" on custom_roles
  for all using (auth.uid() is not null);

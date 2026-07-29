-- Per-user CRUD permission overrides on top of their role.
-- Allows adjusting individual staff access without changing their role.

create table if not exists profile_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  path text not null,
  can_create boolean not null default true,
  can_read   boolean not null default true,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, path)
);

alter table profile_permissions enable row level security;
create policy "profile_permissions_auth" on profile_permissions
  for all using (auth.uid() is not null);

-- Also add crud_permissions column to custom_roles for per-module CRUD config
alter table custom_roles
  add column if not exists crud_permissions jsonb not null default '{}';

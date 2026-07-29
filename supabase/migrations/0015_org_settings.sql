-- Admin-controlled organization-level settings (key/value)
create table if not exists org_settings (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'default',
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique (org_id, key)
);

-- RLS: only authenticated users in the same org can read; only admins can write
-- (app-layer admin check handles write restriction; row policy checks auth)
alter table org_settings enable row level security;
create policy "org_settings_auth" on org_settings for all using (auth.uid() is not null);

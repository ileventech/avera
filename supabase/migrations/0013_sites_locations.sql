-- Create sites table
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  city text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for sites
alter table sites enable row level security;
create policy "sites_auth" on sites for all using (auth.uid() is not null);

-- Create locations table linked to sites
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for locations
alter table locations enable row level security;
create policy "locations_auth" on locations for all using (auth.uid() is not null);

-- Add site_id and location_id references to projects table
alter table projects
  add column if not exists site_id uuid references sites(id) on delete set null,
  add column if not exists location_id uuid references locations(id) on delete set null;

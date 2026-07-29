-- Organization Subscription Plans
-- Controls how many users, custom roles, and which features each organization can use.

create table if not exists plans (
  id text primary key, -- 'free' | 'starter' | 'professional' | 'enterprise'
  name text not null,
  max_users integer not null default 5,       -- max team members
  max_custom_roles integer not null default 0, -- max custom roles they can create
  max_modules integer not null default 5,      -- max sidebar modules accessible
  price_monthly numeric(10,2) not null default 0,
  features jsonb not null default '[]'
);

-- Seed the plan tiers
insert into plans (id, name, max_users, max_custom_roles, max_modules, price_monthly, features) values
  ('free',         'Free',         5,   0,  5,    0,     '["Dashboard","Tasks","Requests"]'),
  ('starter',      'Starter',      15,  2,  12,   29,    '["Dashboard","Tasks","Requests","Client CRM","Basic HR","Basic Finance"]'),
  ('professional', 'Professional', 50,  10, 20,   79,    '["All Starter features","Sales Pipeline","Full HR","Payroll","Facility","Custom Roles"]'),
  ('enterprise',   'Enterprise',   999, 99, 999,  299,   '["Everything","Priority Support","Advanced Analytics","Unlimited Users"]')
on conflict (id) do update set
  name = excluded.name,
  max_users = excluded.max_users,
  max_custom_roles = excluded.max_custom_roles,
  max_modules = excluded.max_modules,
  price_monthly = excluded.price_monthly,
  features = excluded.features;

-- Link organizations to a plan
alter table profiles
  add column if not exists plan_id text not null default 'free' references plans(id);

-- RLS: any authenticated user can read plan data
alter table plans enable row level security;
create policy "plans_read" on plans for select using (auth.uid() is not null);

-- Multi-tenancy rearchitecture.
--
-- Every table so far grants full CRUD to "any authenticated user" — fine for
-- one internal company, wrong the moment this serves many separate customer
-- organizations. This migration adds an `organizations` table, tags every
-- business table with `organization_id`, and rewrites RLS to scope by it.
-- It also fixes two holes from the same root cause (a permission boundary
-- that doesn't actually hold): auth enforcement was fully disabled in
-- middleware, and any signed-in user could self-promote their own `role`.
--
-- Run this whole file as one transaction in the Supabase SQL editor. If you
-- have a branch/preview project, test there first — there's no automated
-- rollback here, and this touches every table.

begin;

-- ============================================================================
-- 1. organizations
-- ============================================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  industry text not null default '',
  team_size text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table organizations enable row level security;
create trigger set_updated_at before update on organizations for each row execute function set_updated_at();

-- profiles needs the column before the helper functions below can reference it.
alter table profiles add column organization_id uuid references organizations(id);

-- ============================================================================
-- 2. helper functions — the backbone every org-scoped RLS policy below uses.
-- security definer + pinned search_path (same pattern as handle_new_user())
-- avoids the infinite-recursion problem a plain RLS policy on profiles would
-- have if it tried to look up the caller's own profiles row directly.
-- ============================================================================
create or replace function current_organization_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function current_user_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "org_select_own" on organizations for select using (id = current_organization_id());
create policy "org_admin_update" on organizations for update using (id = current_organization_id() and current_user_role() = 'Administrator');
-- Deliberately no insert policy for `authenticated` — organizations may only
-- be created by handle_new_user() (security definer, bypasses RLS). That's
-- what stops a user from spinning up extra orgs via a raw client call.

-- Auto-fills organization_id on insert so none of the ~25 existing CRUD pages
-- need to know organizations exist — the DB tags every row transparently.
create or replace function set_organization_id()
returns trigger as $$
begin
  new.organization_id := coalesce(new.organization_id, current_organization_id());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- 3. backfill: one legacy org absorbs all pre-existing data (and the old
-- singleton `company` row's values, if any were ever saved), then every
-- business table gets organization_id added/backfilled/required/indexed.
-- ============================================================================
do $$
declare
  legacy_org_id uuid;
  t text;
begin
  insert into organizations (name) values ('Legacy Organization') returning id into legacy_org_id;

  update organizations o
  set name = c.name, industry = c.industry, team_size = c.team_size
  from company c
  where o.id = legacy_org_id;

  update profiles set organization_id = legacy_org_id where organization_id is null;

  for t in select unnest(array[
    'approvals', 'clients', 'departments', 'agents', 'assets', 'contractors',
    'vendors', 'warehouse_items', 'expenditures', 'incomes', 'invoices', 'orders',
    'payrolls', 'attendances', 'holidays', 'leave_requests', 'staff', 'leads',
    'sale_plans', 'sale_records', 'tasks', 'subscriptions'
  ])
  loop
    execute format('alter table %I add column organization_id uuid references organizations(id)', t);
    execute format('update %I set organization_id = %L where organization_id is null', t, legacy_org_id);
    execute format('alter table %I alter column organization_id set not null', t);
    execute format('create index %I on %I (organization_id)', t || '_organization_id_idx', t);
  end loop;
end $$;

alter table profiles alter column organization_id set not null;
create index profiles_organization_id_idx on profiles (organization_id);

drop table company;

-- ============================================================================
-- 4. swap RLS + add the auto-tag trigger on the 21 tables that shared the
-- uniform "authenticated_full_access" policy from 0001.
-- ============================================================================
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'approvals', 'clients', 'departments', 'agents', 'assets', 'contractors',
    'vendors', 'warehouse_items', 'expenditures', 'incomes', 'invoices', 'orders',
    'payrolls', 'attendances', 'holidays', 'leave_requests', 'staff', 'leads',
    'sale_plans', 'sale_records', 'tasks'
  ])
  loop
    execute format('drop policy "authenticated_full_access" on %I', t);
    execute format('create policy "org_full_access" on %I for all using (organization_id = current_organization_id()) with check (organization_id = current_organization_id())', t);
    execute format('create trigger set_organization_id before insert on %I for each row execute function set_organization_id()', t);
  end loop;
end $$;

-- subscriptions has its own named policies from 0004, not part of the loop above.
drop policy "authenticated_select_subscriptions" on subscriptions;
drop policy "authenticated_insert_subscriptions" on subscriptions;
create policy "org_select_subscriptions" on subscriptions for select using (organization_id = current_organization_id());
create policy "org_insert_subscriptions" on subscriptions for insert with check (organization_id = current_organization_id());
create trigger set_organization_id before insert on subscriptions for each row execute function set_organization_id();

-- ============================================================================
-- 5. profiles: org-scope the two "any authenticated user" policies, and add
-- a role-change guard. This has to be a trigger, not a stricter RLS policy or
-- column-level GRANT — every app user shares the same Postgres role
-- (`authenticated`), so a GRANT can't tell an Administrator apart from a
-- Member at the column level, and RLS USING/WITH CHECK only sees whole rows,
-- not which column changed. A BEFORE UPDATE trigger is the only layer that
-- can see "is `role` specifically what's changing" and reject it unless the
-- caller is an Administrator. It exempts service_role so /api/invite's
-- admin-client role assignment (no auth.uid() session) still works.
-- ============================================================================
drop policy "authenticated_update_any_profile" on profiles;
create policy "org_admins_update_profiles" on profiles for update
  using (organization_id = current_organization_id() and current_user_role() = 'Administrator');

drop policy "authenticated_read_all_profiles" on profiles;
create policy "org_read_profiles" on profiles for select using (organization_id = current_organization_id());

-- users_update_own_profile (0002) is unchanged — still lets someone edit their
-- own name/email — but shares the same "can't restrict by column" blind spot,
-- which is exactly why the guard below applies regardless of which policy matched.
create or replace function guard_profile_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role
     and auth.role() <> 'service_role'
     and coalesce(current_user_role(), '') <> 'Administrator' then
    raise exception 'Only Administrators can change a teammate''s role.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger guard_profile_role_change before update on profiles
  for each row execute function guard_profile_role_change();

-- ============================================================================
-- 6. messages: the INSERT policy only ever checked the sender, never that the
-- recipient is someone the sender can actually see — letting a user message
-- a guessed/known UUID directly, bypassing the email-lookup UI. Once profiles
-- SELECT is org-scoped (step 5), this composes into "recipient must be in the
-- same org" for free, with no new column needed on messages.
-- ============================================================================
drop policy "sender_insert_messages" on messages;
create policy "sender_insert_messages" on messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from profiles where id = recipient_id));

-- ============================================================================
-- 7. handle_new_user(): assign the right organization at signup instead of
-- none at all. Self-registered users (no invited_at) get a brand-new org
-- created right here (security definer, same transaction as the auth.users
-- insert — no race condition). Invited users get the organization_id the
-- invite route now passes through inviteUserByEmail's metadata.
-- ============================================================================
create or replace function handle_new_user()
returns trigger as $$
declare
  org_id uuid;
begin
  org_id := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;
  if org_id is null then
    insert into public.organizations (name) values ('') returning id into org_id;
  end if;

  insert into public.profiles (id, organization_id, email, full_name, role)
  values (
    new.id,
    org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.invited_at is not null then 'Member' else 'Administrator' end
  );
  insert into public.notification_preferences (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

commit;

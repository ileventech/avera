-- Billing/subscription, company profile, and per-user notification
-- preferences for the expanded Settings page.

-- Whoever completes signup themselves (not invited by someone else) is the
-- account owner and should default to Administrator so they can see billing.
-- `invited_at` is set by Supabase when a user is created via
-- auth.admin.inviteUserByEmail, and left null for self-registration.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.invited_at is not null then 'Member' else 'Administrator' end
  );
  insert into public.notification_preferences (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- subscriptions: append-only log of plan changes. The most recent row for
-- a given company is "the current plan" — there's no update, just insert
-- a new row whenever the plan changes (upgrade/downgrade/renewal).
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('free', 'pro', 'enterprise')),
  amount numeric(14,2) not null default 0,
  currency text not null default 'NGN',
  status text not null default 'active' check (status in ('active', 'cancelled')),
  paystack_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;
create policy "authenticated_select_subscriptions" on subscriptions for select using (auth.uid() is not null);
create policy "authenticated_insert_subscriptions" on subscriptions for insert with check (auth.uid() is not null);

create index subscriptions_created_at_idx on subscriptions (created_at desc);

-- company: singleton row describing the one organization this CRM serves.
create table company (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  industry text not null default '',
  team_size text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table company enable row level security;
create policy "authenticated_full_access_company" on company for all using (auth.uid() is not null) with check (auth.uid() is not null);
create trigger set_updated_at before update on company for each row execute function set_updated_at();

-- notification_preferences: one row per user, controls which real events
-- surface in the header notification bell.
create table notification_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  approvals boolean not null default true,
  overdue_tasks boolean not null default true,
  leave_requests boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;
create policy "users_select_own_preferences" on notification_preferences for select using (auth.uid() = id);
create policy "users_update_own_preferences" on notification_preferences for update using (auth.uid() = id);
create policy "users_insert_own_preferences" on notification_preferences for insert with check (auth.uid() = id);
create trigger set_updated_at before update on notification_preferences for each row execute function set_updated_at();

-- Backfill: give any existing users (created before this migration) a
-- default preferences row so the Settings page has something to load.
insert into public.notification_preferences (id)
select id from auth.users
on conflict (id) do nothing;

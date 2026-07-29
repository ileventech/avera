-- Profiles + direct messages for the header's account dropdown and inbox.
--
-- `profiles` mirrors auth.users (id/email/full_name) into a table the
-- anon-key client can actually query — auth.users itself isn't readable
-- from the client, but a compose box needs to look up a teammate by email.
-- It's kept in sync via a trigger on auth.users insert.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "authenticated_read_all_profiles" on profiles for select using (auth.uid() is not null);
create policy "users_update_own_profile" on profiles for update using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for any users who signed up before this migration.
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;

-- messages: direct messages between two team members.
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;
create policy "participants_select_messages" on messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "sender_insert_messages" on messages for insert with check (auth.uid() = sender_id);
create policy "recipient_update_messages" on messages for update using (auth.uid() = recipient_id);

create index messages_recipient_idx on messages (recipient_id, created_at desc);
create index messages_sender_idx on messages (sender_id, created_at desc);

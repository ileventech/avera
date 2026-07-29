-- Roles for the internal team, used by the User Management page.
alter table profiles add column role text not null default 'Member' check (role in ('Administrator', 'Manager', 'Member'));

-- Role management needs any signed-in user to be able to update any other
-- profile's row (there are no permission tiers yet — this app grants full
-- CRUD to any authenticated user everywhere else too, see 0001's top comment).
create policy "authenticated_update_any_profile" on profiles for update using (auth.uid() is not null);

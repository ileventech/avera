-- Expand projects table with new criteria columns

alter table projects
  -- Site/location as denormalized text for simple lookup and display
  add column if not exists site_name text not null default '',
  add column if not exists location_name text not null default '',
  -- Priority
  add column if not exists priority text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  -- Category
  add column if not exists category text default '',
  -- Scale
  add column if not exists total_units integer default 0,
  add column if not exists area_sqm numeric(12,2) default 0,
  -- Timeline
  add column if not exists start_date date,
  add column if not exists end_date date,
  -- Developer / contractor
  add column if not exists developer text default '';

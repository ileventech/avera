-- CRM schema for all list modules.
--
-- RLS: this is an internal single-company CRM, not multi-tenant SaaS, so every
-- policy simply requires an authenticated session (auth.uid() is not null) and
-- grants full CRUD to any logged-in user. Tighten per-table if that changes.
--
-- Column names intentionally match the existing TypeScript field names
-- (camelCase, quoted) so the app's mock `type X = {...}` shapes map 1:1 onto
-- table rows with no translation layer needed.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- approvals -------------------------------------------------------------
create table approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requester text not null,
  date date not null,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- clients -----------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  status text not null default 'Active' check (status in ('Active','Inactive')),
  address text not null default '',
  "referredBy" text not null default '',
  "idNo" text not null default '',
  "idType" text not null default '',
  "idExpiry" date,
  "maritalStatus" text not null default '',
  occupation text not null default '',
  workplace text not null default '',
  "kinName" text not null default '',
  "kinAddress" text not null default '',
  "kinEmail" text not null default '',
  "kinPhone" text not null default '',
  "kinRelation" text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- departments ---------------------------------------------------------------
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head text not null,
  "employeeCount" integer not null default 0,
  budget text not null default '',
  description text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- facility: agents ----------------------------------------------------------
create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agency text not null,
  territory text not null,
  email text not null,
  phone text not null,
  status text not null default 'Active' check (status in ('Active','Onboarding','Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- facility: assets ------------------------------------------------------
create table assets (
  id uuid primary key default gen_random_uuid(),
  "assetTag" text not null,
  name text not null,
  category text not null,
  "assignedTo" text not null default '',
  location text not null default '',
  status text not null default 'Available' check (status in ('In Use','Available','Maintenance','Retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- facility: contractors -----------------------------------------------
create table contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  "contractEnd" date,
  email text not null,
  phone text not null,
  status text not null default 'Active' check (status in ('Active','Completed','Pending Renewal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- facility: vendors -----------------------------------------------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  "contactPerson" text not null,
  email text not null,
  phone text not null,
  status text not null default 'Active' check (status in ('Active','Inactive','Under Review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- facility: warehouse items -----------------------------------------
create table warehouse_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  "itemName" text not null,
  quantity integer not null default 0,
  "warehouseLocation" text not null default '',
  "reorderLevel" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- finance: expenditures -------------------------------------------------
create table expenditures (
  id uuid primary key default gen_random_uuid(),
  "expenseNo" text not null,
  vendor text not null,
  amount numeric(14,2) not null default 0,
  date date not null,
  category text not null,
  status text not null default 'Pending' check (status in ('Approved','Pending','Rejected')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- finance: incomes -------------------------------------------------------
create table incomes (
  id uuid primary key default gen_random_uuid(),
  "transactionId" text not null,
  source text not null,
  amount numeric(14,2) not null default 0,
  date date not null,
  category text not null,
  status text not null default 'Pending' check (status in ('Completed','Pending')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- finance: invoices -------------------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  "invoiceNo" text not null,
  client text not null,
  amount numeric(14,2) not null default 0,
  "issueDate" date not null,
  "dueDate" date not null,
  status text not null default 'Pending' check (status in ('Paid','Pending','Overdue')),
  items text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- finance: orders ----------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  "orderNo" text not null,
  customer text not null,
  "totalAmount" numeric(14,2) not null default 0,
  date date not null,
  status text not null default 'Processing' check (status in ('Processing','Shipped','Delivered','Cancelled')),
  "shippingAddress" text not null default '',
  items text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- finance: payrolls -------------------------------------------------------
create table payrolls (
  id uuid primary key default gen_random_uuid(),
  employee text not null,
  role text not null,
  salary numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  period text not null,
  status text not null default 'Pending' check (status in ('Processed','Pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hr: attendances --------------------------------------------------------
create table attendances (
  id uuid primary key default gen_random_uuid(),
  employee text not null,
  date date not null,
  "clockIn" text not null default '',
  "clockOut" text not null default '',
  status text not null default 'Present' check (status in ('Present','Late','Absent')),
  "hoursWorked" numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hr: holidays ------------------------------------------------------------
create table holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  type text not null default 'Public' check (type in ('Public','Company','Regional')),
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hr: leave_requests -------------------------------------------------------
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee text not null,
  "leaveType" text not null,
  "startDate" date not null,
  "endDate" date not null,
  status text not null default 'Pending' check (status in ('Approved','Pending','Rejected')),
  reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hr: staff -----------------------------------------------------------------
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  department text not null,
  email text not null,
  phone text not null,
  status text not null default 'Active' check (status in ('Active','On Leave','Terminated')),
  "joinDate" date,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- sales: leads --------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text not null,
  phone text not null,
  status text not null default 'New' check (status in ('New','Contacted','Qualified','Lost')),
  source text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- sales: sale_plans -----------------------------------------------------
create table sale_plans (
  id uuid primary key default gen_random_uuid(),
  "planName" text not null,
  "targetRevenue" numeric(14,2) not null default 0,
  period text not null,
  status text not null default 'Draft' check (status in ('Active','Draft','Completed')),
  objectives text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- sales: sale_records ---------------------------------------------------
create table sale_records (
  id uuid primary key default gen_random_uuid(),
  "dealName" text not null,
  client text not null,
  value numeric(14,2) not null default 0,
  "closeDate" date,
  stage text not null default 'Proposal' check (stage in ('Closed Won','Negotiation','Proposal','Closed Lost')),
  owner text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tasks -----------------------------------------------------------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  "startDate" date,
  "dueDate" date,
  priority text not null default 'Medium' check (priority in ('High Priority','Medium','Low')),
  status text not null default 'To Do' check (status in ('To Do','In Progress','Completed')),
  assignee text not null default '',
  "assigneeColor" text not null default '#3B82F6',
  subtasks text[] not null default '{}',
  checklists text[] not null default '{}',
  "blockingTask" text not null default '',
  "waitingTask" text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shared updated_at trigger + RLS for every table above ------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'approvals','clients','departments','agents','assets','contractors',
    'vendors','warehouse_items','expenditures','incomes','invoices','orders',
    'payrolls','attendances','holidays','leave_requests','staff','leads',
    'sale_plans','sale_records','tasks'
  ])
  loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('alter table %I enable row level security', t);
    execute format('create policy "authenticated_full_access" on %I for all using (auth.uid() is not null) with check (auth.uid() is not null)', t);
  end loop;
end $$;

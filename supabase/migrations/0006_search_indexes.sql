-- Indexes for the pagination/search/filter rollout in useCrudTable.
--
-- `ilike '%x%'` (contains, leading wildcard) can't use a plain btree index —
-- needs pg_trgm + GIN. Composite (organization_id, ...) indexes lead with
-- organization_id since current_organization_id() (declared `stable` in
-- 0005) is effectively constant per query, making it the right equality-
-- column-first choice for every filtered query shape this app runs.
--
-- Following 0005's own data-driven-loop convention rather than ~40 hand-
-- typed blocks — less error-prone for camelCase quoted identifiers that
-- must exactly match 0001's casing, and no less safe: this whole file is
-- one transaction either way, so a typo anywhere aborts the same regardless
-- of whether it's spelled out or generated.

begin;

create extension if not exists pg_trgm;

-- 1. Trigram GIN index per column used in an ilike "contains" search
-- (one row per searched column, taken straight from each page's
-- `searchColumns` option).
do $$
declare
  r record;
begin
  for r in select * from (values
    ('approvals', 'title'), ('approvals', 'requester'),
    ('clients', 'name'), ('clients', 'email'),
    ('departments', 'name'), ('departments', 'head'),
    ('invoices', 'client'), ('invoices', 'invoiceNo'),
    ('expenditures', 'vendor'), ('expenditures', 'category'),
    ('orders', 'customer'), ('orders', 'orderNo'),
    ('incomes', 'source'), ('incomes', 'transactionId'),
    ('payrolls', 'employee'), ('payrolls', 'role'),
    ('staff', 'name'), ('staff', 'department'),
    ('attendances', 'employee'),
    ('holidays', 'name'),
    ('leave_requests', 'employee'), ('leave_requests', 'leaveType'),
    ('sale_records', 'dealName'), ('sale_records', 'client'),
    ('leads', 'name'), ('leads', 'company'),
    ('sale_plans', 'planName'),
    ('agents', 'name'), ('agents', 'agency'),
    ('assets', 'name'), ('assets', 'assetTag'),
    ('contractors', 'name'), ('contractors', 'specialty'),
    ('vendors', 'name'), ('vendors', 'service'),
    ('warehouse_items', 'itemName'), ('warehouse_items', 'sku'),
    ('profiles', 'full_name'), ('profiles', 'email')
  ) as t(tbl, col)
  loop
    execute format('create index %I on %I using gin (%I gin_trgm_ops)', r.tbl || '_' || r.col || '_trgm_idx', r.tbl, r.col);
  end loop;
end $$;

-- 2. Composite (organization_id, status_column) index per equality
-- status/type/stage/role filter a page actually uses.
do $$
declare
  r record;
begin
  for r in select * from (values
    ('approvals', 'status'),
    ('clients', 'status'),
    ('invoices', 'status'),
    ('expenditures', 'status'),
    ('orders', 'status'),
    ('incomes', 'status'),
    ('payrolls', 'status'),
    ('staff', 'status'),
    ('attendances', 'status'),
    ('holidays', 'type'),
    ('leave_requests', 'status'),
    ('sale_records', 'stage'),
    ('leads', 'status'),
    ('sale_plans', 'status'),
    ('agents', 'status'),
    ('assets', 'status'),
    ('contractors', 'status'),
    ('vendors', 'status')
  ) as t(tbl, col)
  loop
    execute format('create index %I on %I (organization_id, %I)', r.tbl || '_org_' || r.col || '_idx', r.tbl, r.col);
  end loop;
end $$;

-- 3. Composite (organization_id, date_column) index per date-range filter,
-- skipping tables whose date filter column is `created_at` — those are
-- already covered by the (organization_id, created_at desc, id desc)
-- index every table gets in step 4 below.
do $$
declare
  r record;
begin
  for r in select * from (values
    ('approvals', 'date'),
    ('invoices', 'issueDate'),
    ('expenditures', 'date'),
    ('orders', 'date'),
    ('incomes', 'date'),
    ('staff', 'joinDate'),
    ('attendances', 'date'),
    ('leave_requests', 'startDate'),
    ('sale_records', 'closeDate')
  ) as t(tbl, col)
  loop
    execute format('create index %I on %I (organization_id, %I)', r.tbl || '_org_' || r.col || '_idx', r.tbl, r.col);
  end loop;
end $$;

-- 4. (organization_id, created_at desc, id desc) on every table that goes
-- through useCrudTable — every list query defaults to this exact sort
-- (with an id tiebreaker for stable pagination) regardless of which other
-- filters are active, including the unfiltered "latest first" landing
-- state every page starts on.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'approvals', 'clients', 'departments', 'agents', 'assets', 'contractors',
    'vendors', 'warehouse_items', 'expenditures', 'incomes', 'invoices', 'orders',
    'payrolls', 'attendances', 'holidays', 'leave_requests', 'staff', 'leads',
    'sale_plans', 'sale_records', 'tasks', 'subscriptions', 'profiles'
  ])
  loop
    execute format('create index %I on %I (organization_id, created_at desc, id desc)', t || '_org_created_idx', t);
  end loop;
end $$;

commit;

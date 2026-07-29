-- ============================================================================
-- truncate_all.sql
-- Clears all CRM data from every table. Run in Supabase SQL Editor.
-- WARNING: This is irreversible. All rows will be permanently deleted.
-- ============================================================================

truncate table
  clients,
  approvals,
  incomes,
  expenditures,
  invoices,
  orders,
  payrolls,
  attendances,
  leave_requests,
  staff,
  leads,
  sale_records,
  sale_plans,
  agents,
  assets,
  contractors,
  vendors,
  warehouse_items,
  departments,
  holidays,
  tasks
restart identity cascade;

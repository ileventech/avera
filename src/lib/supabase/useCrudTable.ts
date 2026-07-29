'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { buildSearchOr } from './searchFilter';
import type { DateRange } from '@/components/DateRangeFilter';
import { useToast } from '@/components/Toast';

export type CrudTableOptions = {
  // Set false for aggregate/board views that need every row (dashboards,
  // the header notification bell, the tasks kanban board) rather than one
  // page of results — this preserves the previous unbounded fetch-all
  // behavior instead of silently truncating them to `pageSize`.
  paginate?: boolean;
  pageSize?: number;
  searchColumns?: string[];
  statusColumn?: string;
  dateColumn?: string;
};

const EMPTY_RANGE: DateRange = { from: null, to: null };

function formatTableName(table: string): string {
  const map: Record<string, string> = {
    expenditures: 'Expense',
    incomes: 'Income',
    invoices: 'Invoice',
    orders: 'Order',
    payrolls: 'Payroll',
    attendances: 'Attendance',
    holidays: 'Holiday',
    leave_requests: 'Leave request',
    staff: 'Staff member',
    leads: 'Lead',
    sale_plans: 'Sale plan',
    sale_records: 'Deal',
    tasks: 'Task',
    clients: 'Client',
    departments: 'Department',
    projects: 'Project',
    sites: 'Site',
    locations: 'Location',
    warehouse_items: 'Warehouse item',
    vendors: 'Vendor',
    agents: 'Agent',
    contractors: 'Contractor',
    assets: 'Asset',
    approvals: 'Request',
  };
  return map[table] || table.charAt(0).toUpperCase() + table.slice(1);
}

export function useCrudTable<T extends { id: string }>(table: string, options: CrudTableOptions = {}) {
  const { paginate = true, pageSize = 20, searchColumns, statusColumn, dateColumn } = options;
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilterState] = useState('All');
  const [dateRange, setDateRangeState] = useState<DateRange>(EMPTY_RANGE);
  const [page, setPage] = useState(0);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(0);
  }, []);
  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(0);
  }, []);
  const setDateRange = useCallback((value: DateRange) => {
    setDateRangeState(value);
    setPage(0);
  }, []);

  // Debounce search text ~300ms before it drives a fetch; page reset above
  // happens immediately so the UI feels responsive even before the network
  // request fires.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Serialize searchColumns to a stable primitive so useCallback does not
  // see a new array reference on every render (which would trigger an infinite
  // re-fetch loop: new array → new refresh → effect fires → setLoading(true)
  // → state update → re-render → new array → ...).
  const searchColumnsKey = (searchColumns ?? []).join(',');

  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const cols = searchColumnsKey ? searchColumnsKey.split(',') : [];
      let query = supabase.from(table).select('*', paginate ? { count: 'exact' } : undefined);

      if (cols.length && debouncedSearch.trim()) {
        query = query.or(buildSearchOr(cols, debouncedSearch.trim()));
      }
      if (statusColumn && statusFilter !== 'All') {
        query = query.eq(statusColumn, statusFilter);
      }
      if (dateColumn && dateRange.from) {
        query = query.gte(dateColumn, dateRange.from);
      }
      if (dateColumn && dateRange.to) {
        query = query.lte(dateColumn, dateRange.to);
      }

      query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
      if (paginate) {
        query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      }

      const { data, error, count } = await query.abortSignal(controller.signal);

      // A newer refresh is already in flight — let it handle the state.
      if (controller.signal.aborted) return;

      if (error) {
        setError(error.message);
        toast.error(`Failed to load ${formatTableName(table).toLowerCase()} list.`);
      } else {
        setRows((data ?? []) as T[]);
        if (paginate) setTotalCount(count ?? 0);
      }
    } catch (err) {
      // AbortError (DOMException) or "Failed to fetch" is thrown when the
      // AbortController cancels an in-flight request — a newer refresh will
      // take over, so we silently bail without touching state or showing a toast.
      const isAbort =
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof TypeError && err.message === 'Failed to fetch');
      if (isAbort) return;
      setError('Failed to load data.');
      toast.error(`Failed to load ${formatTableName(table).toLowerCase()} list.`);
    } finally {
      // Only clear loading if this refresh is still the active one.
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, table, paginate, pageSize, page, searchColumnsKey, statusColumn, dateColumn, debouncedSearch, statusFilter, dateRange]);

  // Initial + reactive fetch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  const pageCount = paginate ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const insert = useCallback(
    async (values: Omit<T, 'id'>) => {
      const { data, error } = await supabase.from(table).insert(values as never).select().single();
      if (error) {
        setError(error.message);
        return { data: null, error };
      }
      toast.success(`${formatTableName(table)} created successfully.`);
      if (paginate && page !== 0) setPage(0);
      else await refresh();
      return { data: data as T, error: null };
    },
    [supabase, table, paginate, page, refresh, toast]
  );

  const update = useCallback(
    async (id: string, values: Partial<Omit<T, 'id'>>) => {
      const { data, error } = await supabase.from(table).update(values as never).eq('id', id).select().single();
      if (error) {
        setError(error.message);
        return { data: null, error };
      }
      toast.success(`${formatTableName(table)} updated successfully.`);
      await refresh();
      return { data: data as T, error: null };
    },
    [supabase, table, refresh, toast]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        setError(error.message);
        return { error };
      }
      toast.success(`${formatTableName(table)} deleted successfully.`);
      if (paginate && page > 0 && rows.length === 1) {
        setPage(p => p - 1);
      } else {
        await refresh();
      }
      return { error: null };
    },
    [supabase, table, paginate, page, rows.length, refresh, toast]
  );

  return {
    rows, loading, error, refresh, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  };
}


'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Expense = {
  id: string;
  expenseNo: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  description: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function ExpenditurePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'expenseNo', label: 'Reference / Receipt No.', type: 'text', required: true, placeholder: 'e.g. EXP-1042' },
    { key: 'vendor', label: 'Vendor / Payee', type: 'text', required: true, highlight: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true, highlight: true, format: v => formatCurrency(Number(v)) },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Office', 'Software', 'Infrastructure', 'Travel', 'Marketing'] },
    { key: 'date', label: 'Date Incurred', type: 'date', required: true },
    { key: 'status', label: 'Approval Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] },
    { key: 'description', label: 'Justification / Description', type: 'textarea', required: true, span: 2 },
  ], [formatCurrency]);

  const {
    rows: expenses, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Expense>('expenditures', {
    pageSize: PAGE_SIZE,
    searchColumns: ['vendor', 'category'],
    statusColumn: 'status',
    dateColumn: 'date',
  });
  // Separate unbounded fetch for the trend chart, which aggregates by month
  // across the whole table — a paginated slice would silently mislabel
  // "this page's trend" as "the trend."
  const { rows: allExpenses } = useCrudTable<Expense>('expenditures', { paginate: false });
  const [period, setPeriod] = useState<ChartPeriod>('month');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', exp?: Expense) => {
    setDrawerMode(mode);
    setActiveExpense(exp ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeExpense) return;
    const { error } = await remove(activeExpense.id);
    if (error) { window.alert(`Could not delete expense: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeExpense
      ? await update(activeExpense.id, values as Partial<Expense>)
      : await insert(values as Omit<Expense, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save expense: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const trendData = groupByPeriod(allExpenses, e => e.date, e => e.amount, period);

  const columns: Column<Expense>[] = [
    { key: 'expenseNo', label: 'Ref No' },
    { key: 'vendor', label: 'Vendor', primary: true },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: e => <span style={{ color: '#EF4444', fontWeight: 600 }}>-{formatCurrency(e.amount)}</span> },
    { key: 'status', label: 'Status', render: e => <StatusBadge status={e.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Expenditures</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Track company expenses, vendors, and outgoings.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Record Expense
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Items</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><FileText size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Expenditure Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {trendData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => formatCurrency(Number(v), true)} width={60} />
                  <RechartsTooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.expenditure}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#EF4444' }}>
                  <FileText size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No expenditure trend data</div>
              <div className={styles.emptyStateDescription}>
                Record company outgoings to visualize monthly expenditure patterns.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Record Expense
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', fontSize: '13px' }}>
              <option value="All">Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={expenses} loading={loading} onRowClick={e => openDrawer('view', e)} emptyMessage="No expenses found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeExpense}
        fields={fields}
        titleField="vendor"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Expense"
        onClose={() => setIsDrawerOpen(false)}
        onEdit={() => setDrawerMode('edit')}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        saving={saving}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}

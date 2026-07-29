'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Income = {
  id: string;
  transactionId: string;
  source: string;
  amount: number;
  date: string;
  category: string;
  status: 'Completed' | 'Pending';
  description: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Completed: { bg: '#D1FAE5', text: '#059669' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
};

export default function IncomePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'transactionId', label: 'Transaction ID', type: 'text', required: true, placeholder: 'e.g. TRX-9901' },
    { key: 'source', label: 'Income Source', type: 'text', required: true, highlight: true, placeholder: 'e.g. Stripe, Client X' },
    { key: 'amount', label: 'Amount', type: 'number', required: true, highlight: true, format: v => formatCurrency(Number(v)) },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['SaaS Subscription', 'Consulting', 'One-time Sale', 'Investment', 'Other'] },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed'] },
    { key: 'description', label: 'Description / Notes', type: 'textarea', required: true, span: 2 },
  ], [formatCurrency]);

  const {
    rows: incomes, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Income>('incomes', {
    pageSize: PAGE_SIZE,
    searchColumns: ['source', 'transactionId'],
    statusColumn: 'status',
    dateColumn: 'date',
  });
  // Separate unbounded fetch for the revenue trend chart — an aggregate over
  // the whole table, not one paginated page of it.
  const { rows: allIncomes } = useCrudTable<Income>('incomes', { paginate: false });
  const [period, setPeriod] = useState<ChartPeriod>('month');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeIncome, setActiveIncome] = useState<Income | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', inc?: Income) => {
    setDrawerMode(mode);
    setActiveIncome(inc ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeIncome) return;
    const { error } = await remove(activeIncome.id);
    if (error) { window.alert(`Could not delete income: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeIncome
      ? await update(activeIncome.id, values as Partial<Income>)
      : await insert(values as Omit<Income, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save income: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const trendData = groupByPeriod(allIncomes, i => i.date, i => i.amount, period);

  const columns: Column<Income>[] = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'source', label: 'Source', primary: true },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: i => <span style={{ color: '#059669', fontWeight: 600 }}>+{formatCurrency(i.amount)}</span> },
    { key: 'status', label: 'Status', render: i => <StatusBadge status={i.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Income & Revenue</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Track incoming payments, funding, and revenue streams.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Record Income
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Items</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><DollarSign size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Revenue Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {trendData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => formatCurrency(Number(v), true)} width={60} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIllustration}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#3B82F6' }}>
                  <DollarSign size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No revenue trend data</div>
              <div className={styles.emptyStateDescription}>
                Record your first income transaction to visualize monthly revenue growth over time.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Record Income
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
              <option value="Completed">Completed</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={incomes} loading={loading} onRowClick={i => openDrawer('view', i)} emptyMessage="No income records found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeIncome}
        fields={fields}
        titleField="source"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Income"
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

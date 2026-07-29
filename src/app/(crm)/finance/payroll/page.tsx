'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Users } from 'lucide-react';
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

type Payroll = {
  id: string;
  employee: string;
  role: string;
  salary: number;
  bonus: number;
  period: string;
  status: 'Processed' | 'Pending';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Processed: { bg: '#D1FAE5', text: '#059669' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
};

// Removed costByPeriod helper as we now use generic groupByPeriod

export default function PayrollPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'employee', label: 'Employee Name', type: 'select', required: true, highlight: true, options: staff.map(s => s.name) },
    { key: 'role', label: 'Job Role', type: 'text', required: true, highlight: true },
    { key: 'salary', label: 'Base Salary', type: 'number', required: true, format: v => formatCurrency(Number(v)) },
    { key: 'bonus', label: 'Bonus / Commission', type: 'number', required: true, format: v => formatCurrency(Number(v)) },
    { key: 'period', label: 'Pay Period', type: 'text', required: true, placeholder: 'e.g. April 2026' },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Processed'] },
  ], [staff, formatCurrency]);

  const {
    rows: payrolls, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Payroll>('payrolls', {
    pageSize: PAGE_SIZE,
    searchColumns: ['employee', 'role'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });
  // Separate unbounded fetch for the cost-by-period chart — an aggregate
  // over the whole table, not one paginated page of it.
  const { rows: allPayrolls } = useCrudTable<Payroll>('payrolls', { paginate: false });
  const [period, setPeriod] = useState<ChartPeriod>('month');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activePayroll, setActivePayroll] = useState<Payroll | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', p?: Payroll) => {
    setDrawerMode(mode);
    setActivePayroll(p ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activePayroll) return;
    const { error } = await remove(activePayroll.id);
    if (error) { window.alert(`Could not delete payroll entry: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activePayroll
      ? await update(activePayroll.id, values as Partial<Payroll>)
      : await insert(values as Omit<Payroll, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save payroll entry: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const trendData = groupByPeriod(allPayrolls, p => p.created_at, p => p.salary + p.bonus, period);

  const columns: Column<Payroll>[] = [
    { key: 'employee', label: 'Employee', primary: true },
    { key: 'role', label: 'Role' },
    { key: 'salary', label: 'Base Salary', render: p => formatCurrency(p.salary) },
    { key: 'bonus', label: 'Bonus/Commissions', render: p => <span style={{ color: '#10B981' }}>+{formatCurrency(p.bonus)}</span> },
    { key: 'total', label: 'Total Payout', render: p => <span style={{ fontWeight: 700 }}>{formatCurrency(p.salary + p.bonus)}</span> },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Payroll Management</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Process employee salaries, bonuses, and benefits.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Run Payroll
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Items</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Users size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Payroll Cost by Period</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {trendData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => formatCurrency(Number(v), true)} width={60} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), 'Cost']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.purple}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#8B5CF6' }}>
                  <Users size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No payroll cost history</div>
              <div className={styles.emptyStateDescription}>
                Process payroll entries to track salary and bonus disbursements by period.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Run Payroll
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
              <option value="Processed">Processed</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={payrolls} loading={loading} onRowClick={p => openDrawer('view', p)} emptyMessage="No payroll records found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activePayroll}
        fields={fields}
        titleField="employee"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Payroll Entry"
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

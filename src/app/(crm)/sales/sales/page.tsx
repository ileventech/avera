'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type SaleRecord = {
  id: string;
  dealName: string;
  client: string;
  value: number;
  closeDate: string;
  stage: 'Closed Won' | 'Negotiation' | 'Proposal' | 'Closed Lost';
  owner: string;
  notes: string;
  created_at?: string;
};

const STAGES = ['Closed Won', 'Negotiation', 'Proposal', 'Closed Lost'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Closed Won': { bg: '#D1FAE5', text: '#059669' },
  'Closed Lost': { bg: '#FEE2E2', text: '#DC2626' },
  Negotiation: { bg: '#DBEAFE', text: '#2563EB' },
  Proposal: { bg: '#FEF3C7', text: '#D97706' },
};


export default function SalesPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const { rows: clients } = useCrudTable<any>('clients', { paginate: false });
  const [period, setPeriod] = useState<ChartPeriod>('month');

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'dealName', label: 'Deal Name', type: 'text', required: true, highlight: true },
    { key: 'client', label: 'Client Name', type: 'select', required: true, highlight: true, options: clients.map(c => c.name) },
    { key: 'value', label: 'Deal Value ($)', type: 'number', required: true },
    { key: 'closeDate', label: 'Expected Close Date', type: 'date', required: true },
    { key: 'stage', label: 'Deal Stage', type: 'select', options: ['Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
    { key: 'owner', label: 'Deal Owner', type: 'select', required: true, options: staff.map(s => s.name) },
    { key: 'notes', label: 'Notes / Next Steps', type: 'textarea', span: 2 },
  ], [clients, staff]);

  const {
    rows: sales, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter: filterStage, setStatusFilter: setFilterStage, dateRange, setDateRange,
  } = useCrudTable<SaleRecord>('sale_records', {
    pageSize: PAGE_SIZE,
    searchColumns: ['dealName', 'client'],
    statusColumn: 'stage',
    dateColumn: 'closeDate',
  });
  const stageCounts = useStatusCounts('sale_records', 'stage', [...STAGES]);
  // Separate unbounded fetch for the pipeline total and monthly performance
  // chart — both aggregate over the whole table, not one paginated page.
  const { rows: allSales } = useCrudTable<SaleRecord>('sale_records', { paginate: false });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeSale, setActiveSale] = useState<SaleRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', s?: SaleRecord) => {
    setDrawerMode(mode);
    setActiveSale(s ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeSale) return;
    const { error } = await remove(activeSale.id);
    if (error) { window.alert(`Could not delete deal: ${error.message}`); return; }
    await stageCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeSale
      ? await update(activeSale.id, values as Partial<SaleRecord>)
      : await insert(values as Omit<SaleRecord, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save deal: ${error.message}`); return; }
    await stageCounts.refresh();
    setIsDrawerOpen(false);
  };

  const performanceData = groupByPeriod(allSales, s => s.closeDate, s => s.value, period);
  const pipelineValue = allSales.reduce((acc, s) => acc + s.value, 0);
  const dealsWon = stageCounts.counts['Closed Won'] ?? 0;
  const activeDeals = (stageCounts.counts['Negotiation'] ?? 0) + (stageCounts.counts['Proposal'] ?? 0);

  const columns: Column<SaleRecord>[] = [
    { key: 'dealName', label: 'Deal Name', primary: true },
    { key: 'client', label: 'Client' },
    { key: 'value', label: 'Value', render: s => formatCurrency(s.value) },
    { key: 'closeDate', label: 'Close Date' },
    { key: 'stage', label: 'Stage', render: s => <StatusBadge status={s.stage} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sales Pipeline</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage ongoing deals, track stages, and close rates.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Deal
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Pipeline Value</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><DollarSign size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{formatCurrency(pipelineValue)}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Deals Won</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><CheckCircle size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{dealsWon}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Active Deals</div>
              <div className={styles.kpiIcon} style={{ background: '#FEF3C7', color: '#F59E0B' }}><TrendingUp size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{activeDeals}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Sales Performance Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {performanceData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={v => formatCurrency(Number(v), true)} width={60} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: unknown) => [formatCurrency(Number(value)), 'Value']} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.deal}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#F59E0B' }}>
                  <TrendingUp size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No sales performance data</div>
              <div className={styles.emptyStateDescription}>
                Add deals to the pipeline to track monthly sales performance and revenue.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Add Deal
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
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', fontSize: '13px' }}>
              <option value="All">Stage: All</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={sales} loading={loading} onRowClick={s => openDrawer('view', s)} emptyMessage="No deals found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeSale}
        fields={fields}
        titleField="dealName"
        statusField="stage"
        statusColors={STATUS_COLORS}
        entityLabel="Deal"
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

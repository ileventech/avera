'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Target, DollarSign } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';

type Plan = {
  id: string;
  planName: string;
  targetRevenue: number;
  period: string;
  status: 'Active' | 'Draft' | 'Completed';
  objectives: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Completed: { bg: '#DBEAFE', text: '#2563EB' },
  Draft: { bg: '#F1F5F9', text: '#475569' },
};

export default function SalePlanPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'planName', label: 'Plan Name / Campaign Title', type: 'text', required: true, highlight: true, span: 2 },
    { key: 'targetRevenue', label: 'Target Revenue', type: 'number', required: true, highlight: true, format: v => formatCurrency(Number(v)) },
    { key: 'period', label: 'Period / Timeframe', type: 'text', required: true, placeholder: 'e.g. Q2 2026' },
    { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Completed'] },
    { key: 'objectives', label: 'Strategic Objectives & Notes', type: 'textarea', required: true, span: 2 },
  ], [formatCurrency]);

  const {
    rows: plans, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter,
  } = useCrudTable<Plan>('sale_plans', {
    pageSize: PAGE_SIZE,
    searchColumns: ['planName'],
    statusColumn: 'status',
  });
  // Separate unbounded fetch just for the target-revenue sum — an aggregate
  // over the whole table, not one paginated page of it.
  const { rows: allPlans } = useCrudTable<Plan>('sale_plans', { paginate: false });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', p?: Plan) => {
    setDrawerMode(mode);
    setActivePlan(p ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activePlan) return;
    const { error } = await remove(activePlan.id);
    if (error) { window.alert(`Could not delete plan: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activePlan
      ? await update(activePlan.id, values as Partial<Plan>)
      : await insert(values as Omit<Plan, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save plan: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const totalTargetRevenue = allPlans.reduce((acc, p) => acc + p.targetRevenue, 0);

  const columns: Column<Plan>[] = [
    { key: 'planName', label: 'Plan Name', primary: true },
    { key: 'targetRevenue', label: 'Target Revenue', render: p => formatCurrency(p.targetRevenue) },
    { key: 'period', label: 'Period' },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sales Plans & Strategy</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Define quarterly targets, campaigns, and strategic objectives.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Create Plan
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Plans</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Target size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{totalCount}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Target Revenue</div>
            <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><DollarSign size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{formatCurrency(totalTargetRevenue)}</div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search plans..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', fontSize: '13px' }}>
              <option value="All">Status: All</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={plans} loading={loading} onRowClick={p => openDrawer('view', p)} emptyMessage="No sales plans found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activePlan}
        fields={fields}
        titleField="planName"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Sales Plan"
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

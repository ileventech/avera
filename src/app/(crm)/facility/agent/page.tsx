'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Agent = {
  id: string;
  name: string;
  agency: string;
  territory: string;
  email: string;
  phone: string;
  status: 'Active' | 'Onboarding' | 'Inactive';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Inactive: { bg: '#FEE2E2', text: '#DC2626' },
  Onboarding: { bg: '#DBEAFE', text: '#2563EB' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Agent Full Name', type: 'text', required: true },
  { key: 'agency', label: 'Agency / Brokerage', type: 'text', required: true, highlight: true },
  { key: 'territory', label: 'Territory / Region Assigned', type: 'text', required: true, span: 2, highlight: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'status', label: 'Agent Status', type: 'select', options: ['Active', 'Onboarding', 'Inactive'] },
];

export default function AgentPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: agents, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Agent>('agents', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'agency'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', a?: Agent) => {
    setDrawerMode(mode);
    setActiveAgent(a ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeAgent) return;
    const { error } = await remove(activeAgent.id);
    if (error) {
      window.alert(`Could not delete agent: ${error.message}`);
      return;
    }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeAgent
      ? await update(activeAgent.id, values as Partial<Agent>)
      : await insert(values as Omit<Agent, 'id'>);
    setSaving(false);
    if (error) {
      window.alert(`Could not save agent: ${error.message}`);
      return;
    }
    setIsDrawerOpen(false);
  };

  const columns: Column<Agent>[] = [
    { key: 'name', label: 'Agent Name', primary: true },
    { key: 'agency', label: 'Agency' },
    { key: 'territory', label: 'Territory' },
    { key: 'contact', label: 'Contact Info', render: a => (
      <>
        <div style={{ marginBottom: '4px' }}>{a.email}</div>
        <div>{a.phone}</div>
      </>
    ) },
    { key: 'status', label: 'Status', render: a => <StatusBadge status={a.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Agents & Brokers</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage real estate agents, brokers, and territory representatives.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Agent
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Items</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}></div>
          </div>
          <div className={styles.kpiValue}>{totalCount}</div>
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
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Inactive">Inactive</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={agents} loading={loading} onRowClick={a => openDrawer('view', a)} emptyMessage="No agents found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeAgent}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Agent"
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

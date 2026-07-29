'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter, Users, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source: string;
  created_at?: string;
};

const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  New: { bg: '#FEF3C7', text: '#D97706' },
  Contacted: { bg: '#DBEAFE', text: '#2563EB' },
  Qualified: { bg: '#D1FAE5', text: '#059669' },
  Lost: { bg: '#FEE2E2', text: '#DC2626' },
};

const PIE_COLORS: Record<string, string> = { New: '#F59E0B', Contacted: '#3B82F6', Qualified: '#10B981', Lost: '#EF4444' };

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Contact Name', type: 'text', required: true, highlight: true },
  { key: 'company', label: 'Company', type: 'text', required: true, highlight: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'status', label: 'Lead Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Lost'] },
  { key: 'source', label: 'Source', type: 'text', required: true, placeholder: 'e.g. Website, Referral' },
];

export default function LeadsPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: leads, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Lead>('leads', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'company'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });
  const statusCounts = useStatusCounts('leads', 'status', [...STATUSES]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', l?: Lead) => {
    setDrawerMode(mode);
    setActiveLead(l ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeLead) return;
    const { error } = await remove(activeLead.id);
    if (error) { window.alert(`Could not delete lead: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeLead
      ? await update(activeLead.id, values as Partial<Lead>)
      : await insert(values as Omit<Lead, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save lead: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const statusBreakdown = STATUSES
    .map(status => ({ name: status, value: statusCounts.counts[status] ?? 0, color: PIE_COLORS[status] }))
    .filter(entry => entry.value > 0);

  const columns: Column<Lead>[] = [
    { key: 'name', label: 'Name', primary: true },
    { key: 'company', label: 'Company' },
    { key: 'contact', label: 'Contact', render: l => (
      <>
        <div style={{ marginBottom: '4px' }}>{l.email}</div>
        <div>{l.phone}</div>
      </>
    ) },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: l => <StatusBadge status={l.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Lead Generation</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Capture, track, and qualify potential customers.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Lead
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Leads</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Users size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Qualified Leads</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><User size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['Qualified'] ?? 0}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Lead Status Distribution</h3>
          {statusBreakdown.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIllustration}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#3B82F6' }}>
                  <Users size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No lead data yet</div>
              <div className={styles.emptyStateDescription}>
                Add your first lead to start tracking pipeline status and qualification rates.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Add Lead
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
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={leads} loading={loading} onRowClick={l => openDrawer('view', l)} emptyMessage="No leads found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeLead}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Lead"
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

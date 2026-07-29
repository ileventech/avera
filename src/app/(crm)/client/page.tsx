'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter, Users, UserCheck, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  address: string;
  referredBy: string;
  idNo: string;
  idType: string;
  idExpiry: string;
  maritalStatus: string;
  occupation: string;
  workplace: string;
  kinName: string;
  kinAddress: string;
  kinEmail: string;
  kinPhone: string;
  kinRelation: string;
  created_at?: string;
};

const STATUSES = ['Active', 'Inactive'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Inactive: { bg: '#FEE2E2', text: '#DC2626' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', type: 'text', required: true, highlight: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'address', label: 'Physical Address', type: 'text', required: true, span: 2 },
  { key: 'referredBy', label: 'Referred By', type: 'text' },
  { key: 'idType', label: 'ID Type', type: 'select', options: ['NIN', 'Passport', 'Driver License'] },
  { key: 'idNo', label: 'ID Verification No.', type: 'text' },
  { key: 'idExpiry', label: 'ID Expiring Date', type: 'date' },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced'] },
  { key: 'occupation', label: 'Occupation', type: 'text' },
  { key: 'workplace', label: 'Place of Work', type: 'text' },
  { key: 'kinName', label: 'Next of Kin Full Name', type: 'text' },
  { key: 'kinRelation', label: 'Relationship', type: 'text' },
  { key: 'kinEmail', label: 'Next of Kin Email', type: 'email' },
  { key: 'kinPhone', label: 'Next of Kin Phone', type: 'tel' },
  { key: 'kinAddress', label: 'Next of Kin Address', type: 'text', span: 2 },
];

export default function ClientPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: clients, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Client>('clients', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'email'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });
  const statusCounts = useStatusCounts('clients', 'status', [...STATUSES]);
  const [period, setPeriod] = useState<ChartPeriod>('month');
  // Separate unbounded fetch for the acquisition trend chart — an aggregate
  // over the whole table, not one paginated page of it.
  const { rows: allClients } = useCrudTable<Client>('clients', { paginate: false });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', c?: Client) => {
    setDrawerMode(mode);
    setActiveClient(c ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeClient) return;
    const { error } = await remove(activeClient.id);
    if (error) { window.alert(`Could not delete client: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeClient
      ? await update(activeClient.id, values as Partial<Client>)
      : await insert(values as Omit<Client, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save client: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const growthData = groupByPeriod(allClients, c => c.created_at ?? null, () => 1, period);

  const columns: Column<Client>[] = [
    { key: 'name', label: 'Client Name', primary: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: c => <StatusBadge status={c.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Client Directory</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage real estate clients and their contact information.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Client
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Clients</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Users size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Active Clients</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><UserCheck size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['Active'] ?? 0}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Inactive</div>
              <div className={styles.kpiIcon} style={{ background: '#FEE2E2', color: '#EF4444' }}><Clock size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['Inactive'] ?? 0}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Client Acquisition Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {growthData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: unknown) => [`${value}`, 'New Clients']} />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorClients)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.green}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#10B981' }}>
                  <Users size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No client acquisition data</div>
              <div className={styles.emptyStateDescription}>
                Add your first client to start tracking client growth and acquisition trends over time.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Add Client
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search clients..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', fontSize: '13px' }}>
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={clients} loading={loading} onRowClick={c => openDrawer('view', c)} emptyMessage="No clients found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeClient}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Client"
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

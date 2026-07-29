'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter, Users, UserCheck, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Staff = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  joinDate: string;
  address: string;
  created_at?: string;
};

const PAGE_SIZE = 20;
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  'On Leave': { bg: '#FEF3C7', text: '#D97706' },
  Terminated: { bg: '#FEE2E2', text: '#DC2626' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', type: 'text', required: true, highlight: true },
  { key: 'role', label: 'Role / Title', type: 'text', required: true, highlight: true },
  { key: 'department', label: 'Department', type: 'select', required: true, options: DEPARTMENTS },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Terminated'] },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'joinDate', label: 'Join Date', type: 'date', required: true },
  { key: 'address', label: 'Physical Address', type: 'textarea', span: 2 },
];

export default function StaffPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: staff, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Staff>('staff', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'department'],
    statusColumn: 'status',
    dateColumn: 'joinDate',
  });
  const statusCounts = useStatusCounts('staff', 'status', ['Active', 'On Leave', 'Terminated']);
  const deptCounts = useStatusCounts('staff', 'department', DEPARTMENTS);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', s?: Staff) => {
    setDrawerMode(mode);
    setActiveStaff(s ?? null);
    setIsDrawerOpen(true);
  };

  const refreshCounts = async () => {
    await statusCounts.refresh();
    await deptCounts.refresh();
  };

  const handleDelete = async () => {
    if (!activeStaff) return;
    const { error } = await remove(activeStaff.id);
    if (error) { window.alert(`Could not delete staff member: ${error.message}`); return; }
    await refreshCounts();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeStaff
      ? await update(activeStaff.id, values as Partial<Staff>)
      : await insert(values as Omit<Staff, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save staff member: ${error.message}`); return; }
    await refreshCounts();
    setIsDrawerOpen(false);
  };

  const deptData = DEPARTMENTS
    .map(name => ({ name, count: deptCounts.counts[name] ?? 0 }))
    .filter(entry => entry.count > 0);

  const columns: Column<Staff>[] = [
    { key: 'name', label: 'Employee', primary: true },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'contact', label: 'Contact', render: s => (
      <>
        <div style={{ marginBottom: '4px' }}>{s.email}</div>
        <div>{s.phone}</div>
      </>
    ) },
    { key: 'status', label: 'Status', render: s => <StatusBadge status={s.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Staff Directory</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage employee profiles, roles, and contact information.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Staff Member
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Staff</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Users size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Active Staff</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><UserCheck size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['Active'] ?? 0}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>On Leave</div>
              <div className={styles.kpiIcon} style={{ background: '#FEF3C7', color: '#F59E0B' }}><Clock size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['On Leave'] ?? 0}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Staff by Department</h3>
          {deptData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
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
              <div className={styles.emptyStateTitle}>No department data</div>
              <div className={styles.emptyStateDescription}>
                Add staff members across departments to view the headcount distribution.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Add Staff Member
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
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={staff} loading={loading} onRowClick={s => openDrawer('view', s)} emptyMessage="No staff found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeStaff}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Staff Member"
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

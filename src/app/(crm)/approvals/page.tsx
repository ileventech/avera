'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { useActiveRole } from '@/lib/useActiveRole';
import { filterByRoleOwnership } from '@/lib/rbac';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { Plus, Search, Filter, Inbox } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Approval = {
  id: string;
  title: string;
  requester: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  created_at?: string;
};

const STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const PIE_COLORS: Record<string, string> = { Pending: '#F59E0B', Approved: '#10B981', Rejected: '#EF4444' };



export default function ApprovalsPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { activeRole } = useActiveRole();
  const { user } = useCurrentUser();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'title', label: 'Request Title', type: 'text', required: true, highlight: true, span: 2 },
    { key: 'requester', label: 'Requester', type: 'select', required: true, highlight: true, options: staff.map(s => s.name) },
    { key: 'type', label: 'Request Type', type: 'select', required: true, options: ['Budget Request', 'Headcount', 'Contract', 'Other'] },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] },
  ], [staff]);

  const {
    rows: approvals, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Approval>('approvals', {
    pageSize: PAGE_SIZE,
    searchColumns: ['title', 'requester'],
    statusColumn: 'status',
    dateColumn: 'date',
  });
  const statusCounts = useStatusCounts('approvals', 'status', [...STATUSES]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeApproval, setActiveApproval] = useState<Approval | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', a?: Approval) => {
    setDrawerMode(mode);
    setActiveApproval(a ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeApproval) return;
    const { error } = await remove(activeApproval.id);
    if (error) { window.alert(`Could not delete request: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeApproval
      ? await update(activeApproval.id, values as Partial<Approval>)
      : await insert(values as Omit<Approval, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save request: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const statusBreakdown = STATUSES
    .map(status => ({ name: status, value: statusCounts.counts[status] ?? 0, color: PIE_COLORS[status] }))
    .filter(entry => entry.value > 0);

  const filteredApprovals = useMemo(
    () => filterByRoleOwnership(approvals, activeRole, user?.fullName || user?.email),
    [approvals, activeRole, user]
  );

  const columns: Column<Approval>[] = [
    { key: 'title', label: 'Request Title', primary: true },
    { key: 'requester', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: a => <StatusBadge status={a.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Request Approvals</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Review, approve, or reject incoming organizational requests.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> New Request
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Requests</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Inbox size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Request Status Breakdown</h3>
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
              <div className={`${styles.emptyStateIllustration} ${styles.deal}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#F59E0B' }}>
                  <Inbox size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No approval requests</div>
              <div className={styles.emptyStateDescription}>
                Submit a new approval request to see status breakdown and distribution.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> New Request
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search requests..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <DataTable columns={columns} rows={filteredApprovals} loading={loading} onRowClick={a => openDrawer('view', a)} emptyMessage="No requests found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeApproval}
        fields={fields}
        titleField="title"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Request"
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

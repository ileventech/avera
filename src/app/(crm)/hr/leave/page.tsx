'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { useActiveRole } from '@/lib/useActiveRole';
import { filterByRoleOwnership } from '@/lib/rbac';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { Plus, Search, Filter, FileText, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type LeaveRequest = {
  id: string;
  employee: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  created_at?: string;
};

const STATUSES = ['Approved', 'Pending', 'Rejected'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const PIE_COLORS: Record<string, string> = { Approved: '#10B981', Pending: '#F59E0B', Rejected: '#EF4444' };



export default function LeavePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { activeRole } = useActiveRole();
  const { user } = useCurrentUser();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'employee', label: 'Employee Name', type: 'select', required: true, highlight: true, options: staff.map(s => s.name) },
    { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity/Paternity'] },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
    { key: 'status', label: 'Approval Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true, span: 2 },
  ], [staff]);

  const {
    rows: leaves, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<LeaveRequest>('leave_requests', {
    pageSize: PAGE_SIZE,
    searchColumns: ['employee', 'leaveType'],
    statusColumn: 'status',
    dateColumn: 'startDate',
  });
  const statusCounts = useStatusCounts('leave_requests', 'status', [...STATUSES]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeLeave, setActiveLeave] = useState<LeaveRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', l?: LeaveRequest) => {
    setDrawerMode(mode);
    setActiveLeave(l ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeLeave) return;
    const { error } = await remove(activeLeave.id);
    if (error) { window.alert(`Could not delete request: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeLeave
      ? await update(activeLeave.id, values as Partial<LeaveRequest>)
      : await insert(values as Omit<LeaveRequest, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save request: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const statusBreakdown = STATUSES
    .map(status => ({ name: status, value: statusCounts.counts[status] ?? 0, color: PIE_COLORS[status] }))
    .filter(entry => entry.value > 0);

  const filteredLeaves = useMemo(
    () => filterByRoleOwnership(leaves, activeRole, user?.fullName || user?.email),
    [leaves, activeRole, user]
  );

  const columns: Column<LeaveRequest>[] = [
    { key: 'employee', label: 'Employee', primary: true },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'dates', label: 'Dates', render: l => `${l.startDate} to ${l.endDate}` },
    { key: 'status', label: 'Status', render: l => <StatusBadge status={l.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Leave Requests</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage employee time-off, vacations, and sick leaves.</p>
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
              <div className={styles.kpiTitle}>Total Leave Requests</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><FileText size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Pending Approvals</div>
              <div className={styles.kpiIcon} style={{ background: '#FEF3C7', color: '#F59E0B' }}><Clock size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{statusCounts.counts['Pending'] ?? 0}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Leave Status Breakdown</h3>
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
                  <Clock size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No leave requests</div>
              <div className={styles.emptyStateDescription}>
                Submit employee leave requests to view approval status and distribution.
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
        <DataTable columns={columns} rows={filteredLeaves} loading={loading} onRowClick={l => openDrawer('view', l)} emptyMessage="No leave requests found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeLeave}
        fields={fields}
        titleField="employee"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Leave Request"
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

'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, UserCheck, UserX } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { createClient } from '@/utils/supabase/client';

type Attendance = {
  id: string;
  employee: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: 'Present' | 'Late' | 'Absent';
  hoursWorked: number;
  created_at?: string;
};

const STATUSES = ['Present', 'Late', 'Absent'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Present: { bg: '#D1FAE5', text: '#059669' },
  Late: { bg: '#FEF3C7', text: '#D97706' },
  Absent: { bg: '#FEE2E2', text: '#DC2626' },
};

const PIE_COLORS: Record<string, string> = { Present: '#10B981', Late: '#F59E0B', Absent: '#EF4444' };



// "Today" counts are independent of whatever the user has selected in the
// list's own status/date filters, so they're fetched separately rather than
// derived from the paginated `rows`.
function useTodayCounts() {
  const supabase = useMemo(() => createClient(), []);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const today = new Date().toISOString().slice(0, 10);

  const refresh = useCallback(async () => {
    const results = await Promise.all(
      STATUSES.map(s => supabase.from('attendances').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', s))
    );
    const next: Record<string, number> = {};
    STATUSES.forEach((s, i) => { next[s] = results[i].count ?? 0; });
    setCounts(next);
  }, [supabase, today]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { counts, refresh };
}

export default function AttendancePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { rows: allStaff } = useCrudTable<any>('staff', { paginate: false });
  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'employee', label: 'Employee Name', type: 'select', required: true, highlight: true, options: allStaff.map(s => s.name) },
    { key: 'date', label: 'Date', type: 'date', required: true, highlight: true },
    { key: 'status', label: 'Attendance Status', type: 'select', options: ['Present', 'Late', 'Absent'] },
    { key: 'clockIn', label: 'Clock In', type: 'text', placeholder: 'e.g. 09:00 AM' },
    { key: 'clockOut', label: 'Clock Out', type: 'text', placeholder: 'e.g. 05:00 PM' },
    { key: 'hoursWorked', label: 'Total Hours Worked', type: 'number' },
  ], [allStaff]);

  const {
    rows: records, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Attendance>('attendances', {
    pageSize: PAGE_SIZE,
    searchColumns: ['employee'],
    statusColumn: 'status',
    dateColumn: 'date',
  });
  const statusCounts = useStatusCounts('attendances', 'status', [...STATUSES]);
  const todayCounts = useTodayCounts();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeRecord, setActiveRecord] = useState<Attendance | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', r?: Attendance) => {
    setDrawerMode(mode);
    setActiveRecord(r ?? null);
    setIsDrawerOpen(true);
  };

  const refreshCounts = async () => {
    await statusCounts.refresh();
    await todayCounts.refresh();
  };

  const handleDelete = async () => {
    if (!activeRecord) return;
    const { error } = await remove(activeRecord.id);
    if (error) { window.alert(`Could not delete record: ${error.message}`); return; }
    await refreshCounts();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeRecord
      ? await update(activeRecord.id, values as Partial<Attendance>)
      : await insert(values as Omit<Attendance, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save record: ${error.message}`); return; }
    await refreshCounts();
    setIsDrawerOpen(false);
  };

  const statusBreakdown = STATUSES
    .map(status => ({ name: status, value: statusCounts.counts[status] ?? 0, color: PIE_COLORS[status] }))
    .filter(entry => entry.value > 0);

  const columns: Column<Attendance>[] = [
    { key: 'employee', label: 'Employee', primary: true },
    { key: 'date', label: 'Date' },
    { key: 'times', label: 'Clock In / Out', render: r => (
      <>
        <div style={{ marginBottom: '4px' }}>In: {r.clockIn}</div>
        <div>Out: {r.clockOut}</div>
      </>
    ) },
    { key: 'hoursWorked', label: 'Hours', render: r => `${r.hoursWorked}h` },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Time & Attendance</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Track daily employee clock-ins, hours worked, and punctuality.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Log Attendance
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Present Today</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><UserCheck size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{todayCounts.counts['Present'] ?? 0}</div>
          </div>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Absent Today</div>
              <div className={styles.kpiIcon} style={{ background: '#FEE2E2', color: '#EF4444' }}><UserX size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{todayCounts.counts['Absent'] ?? 0}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Attendance Status Breakdown</h3>
          {statusBreakdown.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.green}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#10B981' }}>
                  <UserCheck size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No attendance records</div>
              <div className={styles.emptyStateDescription}>
                Log daily employee attendance to view punctuality and absence breakdowns.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Log Attendance
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
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={records} loading={loading} onRowClick={r => openDrawer('view', r)} emptyMessage="No records found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeRecord}
        fields={fields}
        titleField="employee"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Attendance Record"
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

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Users, CheckCircle, Umbrella, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { StatusBadge } from '@/components/DataTable';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Staff = { id: string; name: string; role: string; department: string; email: string; status: 'Active' | 'On Leave' | 'Terminated'; created_at?: string };
type Attendance = { id: string; date: string; status: 'Present' | 'Late' | 'Absent' };
type LeaveRequest = { id: string; startDate: string; endDate: string; status: 'Approved' | 'Pending' | 'Rejected' };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  'On Leave': { bg: '#FEF3C7', text: '#D97706' },
  Terminated: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function HRPage() {
  // paginate: false — this page computes stats (attendance %, on-leave
  // count, staff growth trend) across every row, not one page of results.
  const { rows: staff } = useCrudTable<Staff>('staff', { paginate: false });
  const { rows: attendances } = useCrudTable<Attendance>('attendances', { paginate: false });
  const { rows: leaves } = useCrudTable<LeaveRequest>('leave_requests', { paginate: false });
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendances.filter(a => a.date === today);
  const attendancePct = todayAttendance.length > 0
    ? Math.round((todayAttendance.filter(a => a.status === 'Present').length / todayAttendance.length) * 100)
    : null;
  const onLeaveCount = leaves.filter(l => l.status === 'Approved' && l.startDate <= today && l.endDate >= today).length;

  const [period, setPeriod] = useState<ChartPeriod>('month');
  const growthData = groupByPeriod(staff, s => s.created_at ?? null, () => 1, period);
  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Human Resources</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage staff, attendance, and leave.</p>
        </div>
        <Link href="/hr/staff" className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          + Add Staff
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Staff</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Users size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{staff.length}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Attendance Today</div>
              <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><CheckCircle size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{attendancePct === null ? '—' : `${attendancePct}%`}</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>On Leave</div>
              <div className={styles.kpiIcon} style={{ background: '#FEF3C7', color: '#F59E0B' }}><Umbrella size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{onLeaveCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Staff Growth Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {growthData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: unknown) => [`${value}`, 'New Hires']} />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorStaff)" />
                </AreaChart>
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
              <div className={styles.emptyStateTitle}>No staff growth data</div>
              <div className={styles.emptyStateDescription}>
                Add staff members to track hiring trends and headcount growth over time.
              </div>
              <Link href="/hr/staff" className={styles.emptyStateAction}>
                Add Staff Member
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>Staff Directory</div>
          <div className={styles.searchContainer} style={{ width: '240px' }}>
            <span className={styles.searchIcon}><Search size={16} /></span>
            <input type="text" placeholder="Search staff..." className={styles.searchInput} style={{ padding: '8px 16px 8px 36px', fontSize: '13px' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E9F2', color: '#64748B', fontWeight: 500 }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Department</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={styles.avatar} style={{ width: '32px', height: '32px', fontSize: '12px' }}>{s.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#475569' }}>{s.department}</td>
                  <td style={{ padding: '16px', color: '#475569' }}>{s.role}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={s.status} colors={STATUS_COLORS} /></td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

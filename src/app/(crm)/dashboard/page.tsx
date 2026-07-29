'use client';
import { useState, useMemo } from 'react';
import { DollarSign, Users, TrendingUp, Inbox, FileText, Handshake, CheckCircle, Umbrella, UserPlus, Wrench, Truck, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useCurrency } from '@/lib/useCurrency';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Income = { id: string; amount: number; date: string };
type Expenditure = { id: string; amount: number; date: string };
type SaleRecord = { id: string; dealName: string; stage: 'Closed Won' | 'Negotiation' | 'Proposal' | 'Closed Lost' };
type Task = { id: string; title: string; description: string; status: 'To Do' | 'In Progress' | 'Completed'; created_at?: string };
type Staff = { id: string; created_at?: string };
type Attendance = { id: string; date: string; status: 'Present' | 'Late' | 'Absent' };
type LeaveRequest = { id: string; startDate: string; endDate: string; status: 'Approved' | 'Pending' | 'Rejected' };
type Agent = { id: string; created_at?: string };
type Asset = { id: string; status: 'In Use' | 'Available' | 'Maintenance' | 'Retired' };
type Contractor = { id: string; status: 'Active' | 'Completed' | 'Pending Renewal' };

const STAGE_COLORS: Record<string, string> = { 'Closed Won': '#10B981', Negotiation: '#3B82F6', Proposal: '#F59E0B', 'Closed Lost': '#EF4444' };

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => String(current - i));
})();

const MONTH_OPTIONS = [
  { label: 'All Months', value: '' },
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

// Removed ChartDateFilter component as requested

export default function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { rows: incomes } = useCrudTable<Income>('incomes', { paginate: false });
  const { rows: expenditures } = useCrudTable<Expenditure>('expenditures', { paginate: false });
  const { rows: sales } = useCrudTable<SaleRecord>('sale_records', { paginate: false });
  const { rows: tasks } = useCrudTable<Task>('tasks', { paginate: false });
  const { rows: staff } = useCrudTable<Staff>('staff', { paginate: false });
  const { rows: attendances } = useCrudTable<Attendance>('attendances', { paginate: false });
  const { rows: leaves } = useCrudTable<LeaveRequest>('leave_requests', { paginate: false });
  const { rows: agents } = useCrudTable<Agent>('agents', { paginate: false });
  const { rows: assets } = useCrudTable<Asset>('assets', { paginate: false });
  const { rows: contractors } = useCrudTable<Contractor>('contractors', { paginate: false });

  const [chartView, setChartView] = useState<'income' | 'expenditure'>('income');
  const [finPeriod, setFinPeriod] = useState<ChartPeriod>('month');

  const incomeData = groupByPeriod(incomes, i => i.date, i => i.amount, finPeriod);
  const expenditureData = groupByPeriod(expenditures, e => e.date, e => e.amount, finPeriod);
  const activeData = chartView === 'income' ? incomeData : expenditureData;
  const chartColor = chartView === 'income' ? '#3B82F6' : '#EF4444';

  const totalRevenue = incomes.reduce((acc, i) => acc + i.amount, 0);
  const dealsWon = sales.filter(s => s.stage === 'Closed Won').length;
  const pendingDeals = sales.filter(s => s.stage === 'Proposal' || s.stage === 'Negotiation').length;

  const stageBreakdown = (['Closed Won', 'Negotiation', 'Proposal', 'Closed Lost'] as const)
    .map(stage => ({ name: stage, value: sales.filter(s => s.stage === stage).length, color: STAGE_COLORS[stage] }))
    .filter(entry => entry.value > 0);

  const recentTasks = [...tasks].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendances.filter(a => a.date === today);
  const attendancePct = todayAttendance.length > 0
    ? Math.round((todayAttendance.filter(a => a.status === 'Present').length / todayAttendance.length) * 100)
    : null;
  const onLeaveCount = leaves.filter(l => l.status === 'Approved' && l.startDate <= today && l.endDate >= today).length;
  const thisMonth = today.slice(0, 7);
  const newAgentsThisMonth = agents.filter(a => (a.created_at ?? '').slice(0, 7) === thisMonth).length;

  const activeAssets = assets.filter(a => a.status === 'In Use').length;
  const maintenanceRequests = assets.filter(a => a.status === 'Maintenance').length;
  const activeContractors = contractors.filter(c => c.status === 'Active').length;

  const taskStatusBadge = (status: Task['status']) =>
    status === 'Completed' ? styles.completed : status === 'In Progress' ? styles.pending : styles.urgent;

  // Compute max value in chart data to determine Y-axis domain and tick count
  const maxVal = useMemo(() => Math.max(...activeData.map(d => d.amount), 0), [activeData]);
  const yDomain: [number, number] = [0, maxVal > 0 ? maxVal * 1.25 : 100];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>Real Estate Dashboard</h1>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Revenue</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><DollarSign size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{formatCurrency(totalRevenue)}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Staff</div>
            <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><Users size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{staff.length}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Deals Won</div>
            <div className={styles.kpiIcon} style={{ background: '#FEF3C7', color: '#F59E0B' }}><TrendingUp size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{dealsWon}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Pending Deals</div>
            <div className={styles.kpiIcon} style={{ background: '#FDF2F8', color: '#EC4899' }}><Inbox size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{pendingDeals}</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Financial Overview Chart */}
        <div className={styles.panelCard} style={{ height: '420px' }}>
          <div className={styles.panelHeader} style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div className={styles.panelTitle}>Financial Overview</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ChartPeriodFilter value={finPeriod} onChange={setFinPeriod} />
              <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
                <button
                  onClick={() => setChartView('income')}
                  style={{ padding: '5px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: 'none', background: chartView === 'income' ? 'white' : 'transparent', color: chartView === 'income' ? '#0F172A' : '#64748B', boxShadow: chartView === 'income' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >Income</button>
                <button
                  onClick={() => setChartView('expenditure')}
                  style={{ padding: '5px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: 'none', background: chartView === 'expenditure' ? 'white' : 'transparent', color: chartView === 'expenditure' ? '#0F172A' : '#64748B', boxShadow: chartView === 'expenditure' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >Expenditure</button>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%', height: 'calc(100% - 80px)' }}>
            {activeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeData} margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v: number) => formatCurrency(v, true)}
                    domain={yDomain}
                    width={60}
                    tickCount={6}
                  />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), chartView === 'income' ? 'Income' : 'Expenditure']}
                  />
                  <Bar dataKey="amount" fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyStateContainer}>
                <div className={`${styles.emptyStateIllustration} ${chartView === 'expenditure' ? styles.expenditure : ''}`}>
                  <div className={styles.emptyStateDecoration}></div>
                  <div className={styles.emptyStateIcon} style={{ color: chartColor }}>
                    <DollarSign size={28} />
                  </div>
                </div>
                <div className={styles.emptyStateTitle}>No financial data for this period</div>
                <div className={styles.emptyStateDescription}>
                  Log your first {chartView === 'income' ? 'income transaction' : 'expenditure'} to visualize your financial overview here.
                </div>
                <a href={chartView === 'income' ? '/finance/income' : '/finance/expenditure'} className={styles.emptyStateAction}>
                  Log {chartView === 'income' ? 'Income' : 'Expense'}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Deal Stage Breakdown Chart */}
        <div className={styles.panelCard} style={{ height: '420px' }}>
          <div className={styles.panelHeader} style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div className={styles.panelTitle}>Deal Stage Breakdown</div>
          </div>
          {stageBreakdown.length > 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageBreakdown} innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                      {stageBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {stageBreakdown.map(entry => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.color }}></div>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.deal}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#F59E0B' }}>
                  <Handshake size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No deals for this period</div>
              <div className={styles.emptyStateDescription}>
                Create sales deals or adjust the date filter to see your pipeline breakdown.
              </div>
              <a href="/sales/sales" className={styles.emptyStateAction}>Add Deal</a>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Recent Tasks</div>
            <a href="/tasks" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>View all</a>
          </div>
          <div>
            {recentTasks.map(task => (
              <div key={task.id} className={styles.listItem}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemIcon}><FileText size={16} /></div>
                  <div>
                    <div className={styles.itemName}>{task.title}</div>
                    <div className={styles.itemSub}>{task.description || '—'}</div>
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${taskStatusBadge(task.status)}`}>{task.status}</div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No tasks yet.</div>
            )}
          </div>
        </div>

        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>HR Summary</div>
            <a href="/hr/staff" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>View all</a>
          </div>
          <div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon} style={{ color: '#10B981' }}><CheckCircle size={16} /></div>
                <div>
                  <div className={styles.itemName}>Attendance Today</div>
                  <div className={styles.itemSub}>For the current day</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{attendancePct === null ? '—' : `${attendancePct}%`}</div>
            </div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon} style={{ color: '#F59E0B' }}><Umbrella size={16} /></div>
                <div>
                  <div className={styles.itemName}>Staff on Leave</div>
                  <div className={styles.itemSub}>Active approved leaves</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{onLeaveCount}</div>
            </div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon} style={{ color: '#3B82F6' }}><UserPlus size={16} /></div>
                <div>
                  <div className={styles.itemName}>New Agents</div>
                  <div className={styles.itemSub}>Onboarding this month</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{newAgentsThisMonth}</div>
            </div>
          </div>
        </div>

        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Facilities Summary</div>
            <a href="/facility/assets" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>View all</a>
          </div>
          <div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon}><Handshake size={16} /></div>
                <div>
                  <div className={styles.itemName}>Assets In Use</div>
                  <div className={styles.itemSub}>Currently assigned</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{activeAssets}</div>
            </div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon}><Wrench size={16} /></div>
                <div>
                  <div className={styles.itemName}>Maintenance Requests</div>
                  <div className={styles.itemSub}>Assets under maintenance</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{maintenanceRequests}</div>
            </div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemIcon}><Truck size={16} /></div>
                <div>
                  <div className={styles.itemName}>Active Contractors</div>
                  <div className={styles.itemSub}>Currently on-site</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{activeContractors}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

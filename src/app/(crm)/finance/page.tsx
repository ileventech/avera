'use client';
import { CreditCard, Banknote, TrendingDown, Building, Laptop, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from '../crm.module.css';

const expenseData = [
  { name: 'Payroll', value: 65, color: '#3B82F6' },
  { name: 'Marketing', value: 20, color: '#10B981' },
  { name: 'Operations', value: 15, color: '#F59E0B' },
];

export default function FinancePage() {
  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Finance Center</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage income, expenses, and payroll.</p>
        </div>
        <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }}>
          + New Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Balance</div>
              <div className={styles.kpiIcon} style={{background: '#EFF6FF', color: '#3B82F6'}}><CreditCard size={20} /></div>
            </div>
            <div className={styles.kpiValue}>$842,500</div>
            <div className={`${styles.kpiTrend} ${styles.positive}`}>↑ 4.2% vs last month</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Monthly Income</div>
              <div className={styles.kpiIcon} style={{background: '#F0FDF4', color: '#10B981'}}><Banknote size={20} /></div>
            </div>
            <div className={styles.kpiValue}>$124,500</div>
            <div className={`${styles.kpiTrend} ${styles.positive}`}>↑ 12.5% vs last month</div>
          </div>

          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Monthly Expenses</div>
              <div className={styles.kpiIcon} style={{background: '#FEE2E2', color: '#EF4444'}}><TrendingDown size={20} /></div>
            </div>
            <div className={styles.kpiValue}>$42,100</div>
            <div className={`${styles.kpiTrend} ${styles.negative}`}>↑ 2.1% vs last month</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Expense Breakdown</div>
          </div>
          {expenseData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={`${styles.emptyStateIllustration} ${styles.expenditure}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#EF4444' }}>
                  <TrendingDown size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No expense breakdown</div>
              <div className={styles.emptyStateDescription}>
                Record business expenses to view your organizational cost distribution.
              </div>
              <a href="/finance/expenditure" className={styles.emptyStateAction}>
                Log Expense
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>Recent Transactions</div>
          <a href="#" style={{fontSize: '12px', color: '#3B82F6', textDecoration: 'none'}}>View all</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #E5E9F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><Building size={20} /></div>
              <div>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>Office Rent</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Oct 24, 2025</div>
              </div>
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A' }}>-$4,500.00</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #E5E9F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><Laptop size={20} /></div>
              <div>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>Software Subscriptions</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Oct 22, 2025</div>
              </div>
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A' }}>-$850.00</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}><DollarSign size={20} /></div>
              <div>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>Client Payment: Acme Corp</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Oct 21, 2025</div>
              </div>
            </div>
            <div style={{ fontWeight: 600, color: '#10B981' }}>+$12,500.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}

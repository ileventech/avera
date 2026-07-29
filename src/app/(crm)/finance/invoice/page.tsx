'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useStatusCounts } from '@/lib/supabase/useStatusCounts';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';

type Invoice = {
  id: string;
  invoiceNo: string;
  client: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: string;
  created_at?: string;
};

const STATUSES = ['Paid', 'Pending', 'Overdue'] as const;
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Paid: { bg: '#D1FAE5', text: '#059669' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Overdue: { bg: '#FEE2E2', text: '#DC2626' },
};

const PIE_COLORS: Record<string, string> = { Paid: '#10B981', Pending: '#F59E0B', Overdue: '#EF4444' };



export default function InvoicePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();
  const { rows: clients } = useCrudTable<any>('clients', { paginate: false });

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'invoiceNo', label: 'Invoice Number', type: 'text', required: true, placeholder: 'e.g. INV-2026-001' },
    { key: 'client', label: 'Client Name', type: 'select', required: true, highlight: true, options: clients.map(c => c.name) },
    { key: 'amount', label: 'Total Amount', type: 'number', required: true, highlight: true, format: v => formatCurrency(Number(v)) },
    { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Overdue'] },
    { key: 'items', label: 'Line Items / Description', type: 'textarea', required: true, span: 2, placeholder: 'List services or products provided...' },
  ], [clients]);

  const {
    rows: invoices, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Invoice>('invoices', {
    pageSize: PAGE_SIZE,
    searchColumns: ['client', 'invoiceNo'],
    statusColumn: 'status',
    dateColumn: 'issueDate',
  });
  const statusCounts = useStatusCounts('invoices', 'status', [...STATUSES]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', inv?: Invoice) => {
    setDrawerMode(mode);
    setActiveInvoice(inv ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeInvoice) return;
    const { error } = await remove(activeInvoice.id);
    if (error) { window.alert(`Could not delete invoice: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeInvoice
      ? await update(activeInvoice.id, values as Partial<Invoice>)
      : await insert(values as Omit<Invoice, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save invoice: ${error.message}`); return; }
    await statusCounts.refresh();
    setIsDrawerOpen(false);
  };

  const statusBreakdown = STATUSES
    .map(status => ({ name: status, value: statusCounts.counts[status] ?? 0, color: PIE_COLORS[status] }))
    .filter(entry => entry.value > 0);

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', primary: true },
    { key: 'client', label: 'Client' },
    { key: 'amount', label: 'Amount', render: i => formatCurrency(i.amount) },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'status', label: 'Status', render: i => <StatusBadge status={i.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Invoices</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage billing, track payments, and issue new invoices.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Create Invoice
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Items</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><FileText size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Invoice Status Breakdown</h3>
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
              <div className={`${styles.emptyStateIllustration} ${styles.purple}`}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#8B5CF6' }}>
                  <FileText size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No invoices issued</div>
              <div className={styles.emptyStateDescription}>
                Create and issue your first invoice to view billing status breakdown.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Create Invoice
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
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={invoices} loading={loading} onRowClick={i => openDrawer('view', i)} emptyMessage="No invoices found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeInvoice}
        fields={fields}
        titleField="invoiceNo"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Invoice"
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

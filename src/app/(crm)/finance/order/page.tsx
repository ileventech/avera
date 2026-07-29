'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';
import { groupByPeriod, ChartPeriod } from '@/lib/groupByPeriod';
import ChartPeriodFilter from '@/components/ChartPeriodFilter';

type Order = {
  id: string;
  orderNo: string;
  customer: string;
  totalAmount: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
  items: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Processing: { bg: '#FEF3C7', text: '#D97706' },
  Shipped: { bg: '#DBEAFE', text: '#2563EB' },
  Delivered: { bg: '#D1FAE5', text: '#059669' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};


export default function OrderPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();
  const { rows: clients } = useCrudTable<any>('clients', { paginate: false });

  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'orderNo', label: 'Order Number', type: 'text', required: true, placeholder: 'e.g. ORD-5001' },
    { key: 'customer', label: 'Customer Name', type: 'select', required: true, highlight: true, options: clients.map(c => c.name) },
    { key: 'totalAmount', label: 'Total Amount', type: 'number', required: true, highlight: true, format: v => formatCurrency(Number(v)) },
    { key: 'date', label: 'Order Date', type: 'date', required: true },
    { key: 'status', label: 'Fulfillment Status', type: 'select', options: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    { key: 'shippingAddress', label: 'Shipping Address', type: 'text', required: true },
    { key: 'items', label: 'Order Items', type: 'textarea', required: true, span: 2, placeholder: 'List products ordered...' },
  ], [clients, formatCurrency]);

  const {
    rows: orders, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Order>('orders', {
    pageSize: PAGE_SIZE,
    searchColumns: ['customer', 'orderNo'],
    statusColumn: 'status',
    dateColumn: 'date',
  });
  // Separate unbounded fetch just for the target-revenue sum — an aggregate
  // over the whole table, not one paginated page of it.
  const { rows: allOrders } = useCrudTable<Order>('orders', { paginate: false });
  const [period, setPeriod] = useState<ChartPeriod>('month');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', ord?: Order) => {
    setDrawerMode(mode);
    setActiveOrder(ord ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeOrder) return;
    const { error } = await remove(activeOrder.id);
    if (error) { window.alert(`Could not delete order: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeOrder
      ? await update(activeOrder.id, values as Partial<Order>)
      : await insert(values as Omit<Order, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save order: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const volumeData = groupByPeriod(allOrders, o => o.date, () => 1, period);

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', primary: true },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'totalAmount', label: 'Amount', render: o => formatCurrency(o.totalAmount) },
    { key: 'status', label: 'Status', render: o => <StatusBadge status={o.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sales Orders</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage customer orders, shipping status, and fulfillment.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Create Order
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiCard} style={{ flex: 1, marginBottom: 0 }}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitle}>Total Items</div>
              <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><ShoppingCart size={20} /></div>
            </div>
            <div className={styles.kpiValue}>{totalCount}</div>
          </div>
        </div>

        <div className={styles.panelCard} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Order Volume Trend</h3>
            <ChartPeriodFilter value={period} onChange={setPeriod} />
          </div>
          {volumeData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <RechartsTooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: unknown) => [`${value}`, 'Orders']}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIllustration}>
                <div className={styles.emptyStateDecoration}></div>
                <div className={styles.emptyStateIcon} style={{ color: '#3B82F6' }}>
                  <ShoppingCart size={28} />
                </div>
              </div>
              <div className={styles.emptyStateTitle}>No order volume history</div>
              <div className={styles.emptyStateDescription}>
                Create customer orders to view monthly fulfillment and sales volume.
              </div>
              <button className={styles.emptyStateAction} onClick={() => openDrawer('create')}>
                <Plus size={16} /> Create Order
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
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={orders} loading={loading} onRowClick={o => openDrawer('view', o)} emptyMessage="No orders found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeOrder}
        fields={fields}
        titleField="orderNo"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Order"
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

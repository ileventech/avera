'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Vendor = {
  id: string;
  name: string;
  service: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Under Review';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Inactive: { bg: '#FEE2E2', text: '#DC2626' },
  'Under Review': { bg: '#FEF3C7', text: '#D97706' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Vendor Company Name', type: 'text', required: true },
  { key: 'service', label: 'Service Provided', type: 'text', required: true, highlight: true, placeholder: 'e.g. IT Hardware, Office Cleaning' },
  { key: 'contactPerson', label: 'Primary Contact Person', type: 'text', required: true, highlight: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'status', label: 'Vendor Status', type: 'select', options: ['Active', 'Under Review', 'Inactive'] },
];

export default function VendorPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: vendors, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Vendor>('vendors', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'service'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', v?: Vendor) => {
    setDrawerMode(mode);
    setActiveVendor(v ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeVendor) return;
    const { error } = await remove(activeVendor.id);
    if (error) { window.alert(`Could not delete vendor: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeVendor
      ? await update(activeVendor.id, values as Partial<Vendor>)
      : await insert(values as Omit<Vendor, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save vendor: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Vendor>[] = [
    { key: 'name', label: 'Vendor Name', primary: true },
    { key: 'service', label: 'Service Provided' },
    { key: 'contactPerson', label: 'Primary Contact' },
    { key: 'contact', label: 'Contact Info', render: v => (
      <>
        <div style={{ marginBottom: '4px' }}>{v.email}</div>
        <div>{v.phone}</div>
      </>
    ) },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Vendor Management</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage 3rd-party suppliers, service providers, and contacts.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Vendor
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Items</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}></div>
          </div>
          <div className={styles.kpiValue}>{totalCount}</div>
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
              <option value="Under Review">Under Review</option>
              <option value="Inactive">Inactive</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={vendors} loading={loading} onRowClick={v => openDrawer('view', v)} emptyMessage="No vendors found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeVendor}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Vendor"
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

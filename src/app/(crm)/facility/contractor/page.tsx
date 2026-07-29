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

type Contractor = {
  id: string;
  name: string;
  specialty: string;
  contractEnd: string;
  email: string;
  phone: string;
  status: 'Active' | 'Completed' | 'Pending Renewal';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Completed: { bg: '#DBEAFE', text: '#2563EB' },
  'Pending Renewal': { bg: '#FEF3C7', text: '#D97706' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Contractor Firm Name', type: 'text', required: true },
  { key: 'specialty', label: 'Specialty / Trade', type: 'text', required: true, highlight: true, placeholder: 'e.g. Electrical, HVAC, Security' },
  { key: 'contractEnd', label: 'Contract End Date', type: 'date', required: true, highlight: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { key: 'status', label: 'Contract Status', type: 'select', options: ['Active', 'Pending Renewal', 'Completed'] },
];

export default function ContractorPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: contractors, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Contractor>('contractors', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'specialty'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeContractor, setActiveContractor] = useState<Contractor | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', c?: Contractor) => {
    setDrawerMode(mode);
    setActiveContractor(c ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeContractor) return;
    const { error } = await remove(activeContractor.id);
    if (error) { window.alert(`Could not delete contractor: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeContractor
      ? await update(activeContractor.id, values as Partial<Contractor>)
      : await insert(values as Omit<Contractor, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save contractor: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Contractor>[] = [
    { key: 'name', label: 'Contractor Firm', primary: true },
    { key: 'specialty', label: 'Specialty' },
    { key: 'contractEnd', label: 'Contract Expiry' },
    { key: 'contact', label: 'Contact Info', render: c => (
      <>
        <div style={{ marginBottom: '4px' }}>{c.email}</div>
        <div>{c.phone}</div>
      </>
    ) },
    { key: 'status', label: 'Status', render: c => <StatusBadge status={c.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Contractor Management</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage facility contractors, service agreements, and SLAs.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Contractor
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
              <option value="Pending Renewal">Pending Renewal</option>
              <option value="Completed">Completed</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={contractors} loading={loading} onRowClick={c => openDrawer('view', c)} emptyMessage="No contractors found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeContractor}
        fields={FIELDS}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Contractor"
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

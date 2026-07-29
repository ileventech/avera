'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  assignedTo: string;
  location: string;
  status: 'In Use' | 'Available' | 'Maintenance' | 'Retired';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Available: { bg: '#D1FAE5', text: '#059669' },
  'In Use': { bg: '#DBEAFE', text: '#2563EB' },
  Maintenance: { bg: '#FEF3C7', text: '#D97706' },
  Retired: { bg: '#FEE2E2', text: '#DC2626' },
};



export default function AssetsPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'assetTag', label: 'Asset Tag ID', type: 'text', required: true, highlight: true, placeholder: 'e.g. AST-004' },
    { key: 'name', label: 'Asset Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Hardware', 'Software License', 'Furniture', 'Vehicle'], highlight: true },
    { key: 'assignedTo', label: 'Assigned To (Staff)', type: 'select', options: ['Unassigned', ...staff.map(s => s.name)] },
    { key: 'location', label: 'Location / Room', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Available', 'In Use', 'Maintenance', 'Retired'] },
  ], [staff]);

  const {
    rows: assets, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Asset>('assets', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'assetTag'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', a?: Asset) => {
    setDrawerMode(mode);
    setActiveAsset(a ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeAsset) return;
    const { error } = await remove(activeAsset.id);
    if (error) { window.alert(`Could not delete asset: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeAsset
      ? await update(activeAsset.id, values as Partial<Asset>)
      : await insert(values as Omit<Asset, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save asset: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Asset>[] = [
    { key: 'assetTag', label: 'Asset Tag', primary: true },
    { key: 'name', label: 'Name & Category', render: a => (
      <>
        <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500, marginBottom: '2px' }}>{a.name}</div>
        <div style={{ fontSize: '12px', color: '#64748B' }}>{a.category}</div>
      </>
    ) },
    { key: 'assignedTo', label: 'Assigned To', render: a => <>{a.assignedTo || 'Unassigned'}</> },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: a => <StatusBadge status={a.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Asset Management</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Track company equipment, assignments, and condition.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Asset
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
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={assets} loading={loading} onRowClick={a => openDrawer('view', a)} emptyMessage="No assets found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeAsset}
        fields={fields}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Asset"
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

'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search, Filter, CalendarDays } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import Pagination from '@/components/Pagination';

type Holiday = {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Company' | 'Regional';
  location: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Public: { bg: '#DBEAFE', text: '#2563EB' },
  Company: { bg: '#D1FAE5', text: '#059669' },
  Regional: { bg: '#FEF3C7', text: '#D97706' },
};

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Holiday Name', type: 'text', required: true, highlight: true },
  { key: 'date', label: 'Date', type: 'date', required: true, highlight: true },
  { key: 'type', label: 'Type', type: 'select', options: ['Public', 'Company', 'Regional'] },
  { key: 'location', label: 'Location / Applicability', type: 'text', required: true, placeholder: 'e.g. Global, US Only, UK Office' },
];

export default function HolidayPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: holidays, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter: filterType, setStatusFilter: setFilterType,
  } = useCrudTable<Holiday>('holidays', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name'],
    statusColumn: 'type',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeHoliday, setActiveHoliday] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', h?: Holiday) => {
    setDrawerMode(mode);
    setActiveHoliday(h ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeHoliday) return;
    const { error } = await remove(activeHoliday.id);
    if (error) { window.alert(`Could not delete holiday: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeHoliday
      ? await update(activeHoliday.id, values as Partial<Holiday>)
      : await insert(values as Omit<Holiday, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save holiday: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Holiday>[] = [
    { key: 'name', label: 'Holiday', primary: true },
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type', render: h => <StatusBadge status={h.type} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Holidays & Non-Working Days</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage public holidays and company-wide closures.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Holiday
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Holidays</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><CalendarDays size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{totalCount}</div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search holidays..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', fontSize: '13px' }}>
              <option value="All">Type: All</option>
              <option value="Public">Public</option>
              <option value="Company">Company</option>
              <option value="Regional">Regional</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={holidays} loading={loading} onRowClick={h => openDrawer('view', h)} emptyMessage="No holidays found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeHoliday}
        fields={FIELDS}
        titleField="name"
        statusField="type"
        statusColors={STATUS_COLORS}
        entityLabel="Holiday"
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

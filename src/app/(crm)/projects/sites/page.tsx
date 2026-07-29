'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, MapPin, Building2, CheckCircle, XCircle, Globe } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import Pagination from '@/components/Pagination';

type Site = {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  Inactive: { bg: '#FEE2E2', text: '#DC2626' },
};

function MetricCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #E5E9F2', borderRadius: '12px',
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
      flex: '1 1 140px', minWidth: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={accent} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: accent, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function SitesPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();

  const fields: FieldConfig[] = [
    { key: 'name', label: 'Site Name', type: 'text', required: true, highlight: true, placeholder: 'e.g. Sector 15 Site' },
    { key: 'address', label: 'Address', type: 'text', required: true },
    { key: 'city', label: 'City', type: 'text', required: true, highlight: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  ];

  const {
    rows: sites, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter,
  } = useCrudTable<Site>('sites', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'address', 'city'],
    statusColumn: 'status',
  });

  // ── KPI metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = sites.length;
    const active = sites.filter(s => s.status === 'Active').length;
    const inactive = sites.filter(s => s.status === 'Inactive').length;
    const cities = new Set(sites.map(s => s.city).filter(Boolean)).size;
    return { total, active, inactive, cities };
  }, [sites]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeSite, setActiveSite] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', s?: Site) => {
    setDrawerMode(mode);
    setActiveSite(s ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeSite) return;
    const { error } = await remove(activeSite.id);
    if (error) { window.alert(`Could not delete: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeSite
      ? await update(activeSite.id, values as Partial<Site>)
      : await insert(values as Omit<Site, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Site>[] = [
    {
      key: 'name',
      label: 'Site Name',
      primary: true,
      render: s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '6px', color: '#2563EB', display: 'flex', alignItems: 'center' }}>
            <Building2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>{s.address}</div>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City', render: s => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
        <MapPin size={13} />
        <span style={{ fontSize: '13px' }}>{s.city}</span>
      </div>
    )},
    { key: 'status', label: 'Status', render: s => <StatusBadge status={s.status} colors={STATUS_COLORS} /> },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sites</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage all physical sites, locations and their operational status.</p>
        </div>
        {canCreate && (
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Site
          </button>
        )}
      </div>

      {/* ── KPI Metrics ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <MetricCard icon={Building2} label="Total Sites" value={metrics.total} accent="#2563EB" />
        <MetricCard icon={CheckCircle} label="Active Sites" value={metrics.active} sub={metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}%` : '—'} accent="#059669" />
        <MetricCard icon={XCircle} label="Inactive Sites" value={metrics.inactive} accent="#DC2626" />
        <MetricCard icon={Globe} label="Cities Covered" value={metrics.cities} sub="unique cities" accent="#7C3AED" />
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search sites..." className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
              <Filter size={16} /> Status:
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={sites}
          loading={loading}
          onRowClick={s => openDrawer('view', s)}
          emptyMessage="No sites found."
        />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeSite as any}
        fields={fields}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel="Site"
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

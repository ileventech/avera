'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, MapPin, Layers, Link, BarChart2 } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import Pagination from '@/components/Pagination';

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

type LocationItem = {
  id: string;
  site_id: string;
  name: string;
  description: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

export default function LocationsPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { rows: sites } = useCrudTable<any>('sites', { paginate: false });

  // Map site IDs to name for lookup list
  const siteMap = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach(s => map.set(s.id, s.name));
    return map;
  }, [sites]);

  const fields = useMemo<FieldConfig[]>(() => [
    {
      key: 'site_id',
      label: 'Site',
      type: 'select',
      required: true,
      highlight: true,
      options: sites.map(s => s.name),
    },
    { key: 'name', label: 'Location Name', type: 'text', required: true, highlight: true, placeholder: 'e.g. Block B, Plot 4' },
    { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  ], [sites]);

  const {
    rows: locations, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch,
  } = useCrudTable<LocationItem>('locations', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'description'],
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeLocation, setActiveLocation] = useState<LocationItem | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', l?: LocationItem) => {
    setDrawerMode(mode);
    setActiveLocation(l ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeLocation) return;
    const { error } = await remove(activeLocation.id);
    if (error) { window.alert(`Could not delete location: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    // Map selected site name back to site ID
    const selectedSiteName = values.site_id;
    const matchedSite = sites.find(s => s.name === selectedSiteName);
    const siteId = matchedSite ? matchedSite.id : sites[0]?.id;

    const payload = {
      ...values,
      site_id: siteId,
    };

    const { error } = drawerMode === 'edit' && activeLocation
      ? await update(activeLocation.id, payload as Partial<LocationItem>)
      : await insert(payload as Omit<LocationItem, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save location: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  // Convert locations to display list mapping site names
  const displayLocations = useMemo(() => {
    return locations.map(l => ({
      ...l,
      site_name: siteMap.get(l.site_id) || 'Unknown Site',
    }));
  }, [locations, siteMap]);

  // ── KPI metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = locations.length;
    const linkedSites = new Set(locations.map(l => l.site_id)).size;
    const avgPerSite = linkedSites > 0 ? (total / linkedSites).toFixed(1) : '—';
    return { total, linkedSites, avgPerSite };
  }, [locations]);

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Location Name',
      primary: true,
      render: l => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="#64748B" />
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{l.name}</span>
        </div>
      ),
    },
    { key: 'site_name', label: 'Linked Site' },
    { key: 'description', label: 'Description' },
  ];

  // Map drawer entity value for View mode
  const drawerEntity = useMemo(() => {
    if (!activeLocation) return null;
    const matchedSiteName = siteMap.get(activeLocation.site_id) || '';
    return {
      ...activeLocation,
      site_id: matchedSiteName,
    };
  }, [activeLocation, siteMap]);

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Locations</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage sub-locations and sections linked under main sites.</p>
        </div>
        {canCreate && (
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Location
          </button>
        )}
      </div>

      {/* ── KPI Metrics ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <MetricCard icon={Layers} label="Total Locations" value={metrics.total} accent="#2563EB" />
        <MetricCard icon={Link} label="Linked Sites" value={metrics.linkedSites} sub="unique sites" accent="#059669" />
        <MetricCard icon={BarChart2} label="Avg per Site" value={metrics.avgPerSite} sub="locations/site" accent="#7C3AED" />
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search locations..." className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={displayLocations}
          loading={loading}
          onRowClick={l => openDrawer('view', l)}
          emptyMessage="No locations found."
        />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={drawerEntity}
        fields={fields}
        titleField="name"
        entityLabel="Location"
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

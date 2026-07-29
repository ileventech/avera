'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Briefcase, Building, Landmark, Grid, Layers, TrendingUp, CheckCircle, Clock, DollarSign, BarChart2, AlertCircle } from 'lucide-react';
import styles from '../app/(crm)/crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column, StatusBadge } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';
import { useCurrency } from '@/lib/useCurrency';

type Project = {
  id: string;
  name: string;
  type: 'Project' | 'Building' | 'Land' | 'Block' | 'Other';
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  site_name?: string;
  location_name?: string;
  budget: number;
  total_units?: number;
  area_sqm?: number;
  start_date?: string;
  end_date?: string;
  manager: string;
  developer?: string;
  description: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Planning: { bg: '#EFF6FF', text: '#1E40AF' },
  Active: { bg: '#D1FAE5', text: '#059669' },
  'On Hold': { bg: '#FEF3C7', text: '#D97706' },
  Completed: { bg: '#ECFDF5', text: '#047857' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  Low: { bg: '#F0FDF4', text: '#16A34A' },
  Medium: { bg: '#FFFBEB', text: '#D97706' },
  High: { bg: '#FEF3C7', text: '#B45309' },
  Critical: { bg: '#FEE2E2', text: '#DC2626' },
};

const TYPE_ICONS: Record<string, any> = {
  Project: Briefcase,
  Building: Building,
  Land: Landmark,
  Block: Grid,
  Other: Layers,
};

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E9F2',
      borderRadius: '12px',
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flex: '1 1 140px',
      minWidth: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
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

export default function ProjectsPageShared({ filterType }: { filterType?: Project['type'] }) {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { formatCurrency } = useCurrency();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const { rows: sites } = useCrudTable<any>('sites', { paginate: false });
  const { rows: locations } = useCrudTable<any>('locations', { paginate: false });

  // Build site name -> location names map for cascade dropdown
  const locationsBySite = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const site of sites) {
      map[site.name] = locations
        .filter((l: any) => l.site_id === site.id)
        .map((l: any) => l.name);
    }
    return map;
  }, [sites, locations]);

  const fields = useMemo<FieldConfig[]>(() => [
    // Core identity
    { key: 'name', label: 'Project Name', type: 'text', required: true, highlight: true, placeholder: 'e.g. Sunrise Apartments Phase 1' },
    { key: 'type', label: 'Type', type: 'select', options: ['Project', 'Building', 'Land', 'Block', 'Other'], required: true, highlight: true },
    // Status & priority
    { key: 'status', label: 'Status', type: 'select', options: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    // Category
    { key: 'category', label: 'Category', type: 'select', options: ['Residential', 'Commercial', 'Mixed-Use', 'Industrial', 'Infrastructure', 'Land Development'] },
    // Site & location cascade
    { key: 'site_name', label: 'Site', type: 'select', options: sites.map(s => s.name) },
    {
      key: 'location_name', label: 'Location',
      type: 'select',
      dependsOn: 'site_name',
      optionsByDependency: locationsBySite,
    },
    // Financials
    { key: 'budget', label: 'Budget ($)', type: 'number', placeholder: 'e.g. 500000' },
    // Scale
    { key: 'total_units', label: 'Total Units', type: 'number', placeholder: 'e.g. 120' },
    { key: 'area_sqm', label: 'Area (sqm)', type: 'number', placeholder: 'e.g. 4500' },
    // Timeline
    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },
    // People
    { key: 'manager', label: 'Project Manager', type: 'select', options: staff.map(s => s.name) },
    { key: 'developer', label: 'Developer / Contractor', type: 'text', placeholder: 'e.g. Apex Builders Ltd.' },
    // Description
    { key: 'description', label: 'Description', type: 'textarea', span: 2 },
  ], [staff, sites, locationsBySite]);

  const {
    rows: allProjects, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, statusFilter, setStatusFilter, dateRange, setDateRange,
  } = useCrudTable<Project>('projects', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'site_name', 'location_name', 'manager', 'category'],
    statusColumn: 'status',
    dateColumn: 'created_at',
  });

  const filteredProjects = useMemo(() => {
    if (!filterType) return allProjects;
    return allProjects.filter(p => p.type === filterType);
  }, [allProjects, filterType]);

  // ── KPI metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const base = filterType ? allProjects.filter(p => p.type === filterType) : allProjects;
    const total = base.length;
    const active = base.filter(p => p.status === 'Active').length;
    const planning = base.filter(p => p.status === 'Planning').length;
    const completed = base.filter(p => p.status === 'Completed').length;
    const onHold = base.filter(p => p.status === 'On Hold').length;
    const totalBudget = base.reduce((s, p) => s + (Number(p.budget) || 0), 0);
    const avgBudget = total > 0 ? totalBudget / total : 0;
    return { total, active, planning, completed, onHold, totalBudget, avgBudget };
  }, [allProjects, filterType]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', p?: Project) => {
    setDrawerMode(mode);
    setActiveProject(p ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeProject) return;
    const { error } = await remove(activeProject.id);
    if (error) { window.alert(`Could not delete: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    
    // Resolve UUID FKs
    const selectedSiteName = values.site_name;
    const matchedSite = sites.find(s => s.name === selectedSiteName);
    const siteId = matchedSite ? matchedSite.id : null;

    const selectedLocName = values.location_name;
    const matchedLoc = siteId ? locations.find(l => l.name === selectedLocName && l.site_id === siteId) : null;
    const locationId = matchedLoc ? matchedLoc.id : null;

    const payload = {
      ...values,
      site_id: siteId,
      location_id: locationId,
      type: filterType || (values.type as Project['type']) || 'Project',
    };
    const { error } = drawerMode === 'edit' && activeProject
      ? await update(activeProject.id, payload as any)
      : await insert(payload as any);
    setSaving(false);
    if (error) { window.alert(`Could not save: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Name',
      primary: true,
      render: p => {
        const Icon = TYPE_ICONS[p.type] || Layers;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#F1F5F9', padding: '6px', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center' }}>
              <Icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{p.type}{p.category ? ` · ${p.category}` : ''}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'site_name',
      label: 'Site / Location',
      render: p => (
        <div>
          <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{p.site_name || '—'}</div>
          {p.location_name && <div style={{ fontSize: '11px', color: '#64748B' }}>{p.location_name}</div>}
        </div>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      render: p => p.budget ? formatCurrency(Number(p.budget), true) : '—'
    },
    { key: 'manager', label: 'Manager' },
    {
      key: 'priority',
      label: 'Priority',
      render: p => p.priority ? <StatusBadge status={p.priority} colors={PRIORITY_COLORS} /> : <span style={{ color: '#94A3B8' }}>—</span>,
    },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} colors={STATUS_COLORS} /> },
  ];

  const title = filterType ? `${filterType}s` : 'Projects';

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{title}</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage all {title.toLowerCase()}, sites, developments and status.</p>
        </div>
        {canCreate && (
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add {filterType || 'Project'}
          </button>
        )}
      </div>

      {/* ── KPI Metrics ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <MetricCard icon={filterType ? TYPE_ICONS[filterType] || Layers : Briefcase} label={`Total ${title}`} value={metrics.total} accent="#2563EB" />
        <MetricCard icon={TrendingUp} label="Active" value={metrics.active} sub={metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}%` : '—'} accent="#059669" />
        <MetricCard icon={Clock} label="Planning" value={metrics.planning} accent="#D97706" />
        <MetricCard icon={CheckCircle} label="Completed" value={metrics.completed} accent="#047857" />
        <MetricCard icon={AlertCircle} label="On Hold" value={metrics.onHold} accent="#DC2626" />
        <MetricCard icon={DollarSign} label="Total Budget" value={formatCurrency(metrics.totalBudget, true)} sub={`Avg ${formatCurrency(metrics.avgBudget, true)}`} accent="#7C3AED" />
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder={`Search ${title.toLowerCase()}...`} className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
              <Filter size={16} /> Status:
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={filteredProjects}
          loading={loading}
          onRowClick={p => openDrawer('view', p)}
          emptyMessage={`No ${title.toLowerCase()} found.`}
        />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeProject as any}
        fields={fields}
        titleField="name"
        statusField="status"
        statusColors={STATUS_COLORS}
        entityLabel={filterType || 'Project'}
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

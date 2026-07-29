'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState, useMemo } from 'react';
import { Plus, Search, Users, Building } from 'lucide-react';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column } from '@/components/DataTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import Pagination from '@/components/Pagination';

type Department = {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: string;
  description: string;
  location: string;
  created_at?: string;
};

const PAGE_SIZE = 20;



export default function DepartmentPage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });
  const fields = useMemo<FieldConfig[]>(() => [
    { key: 'name', label: 'Department Name', type: 'text', required: true, highlight: true },
    { key: 'head', label: 'Department Head', type: 'select', required: true, highlight: true, options: staff.map(s => s.name) },
    { key: 'employeeCount', label: 'Headcount (Employees)', type: 'number', required: true },
    { key: 'budget', label: 'Annual Budget', type: 'text', required: true, placeholder: 'e.g. $500,000' },
    { key: 'location', label: 'Primary Location', type: 'text', required: true, placeholder: 'e.g. HQ - Floor 3' },
    { key: 'description', label: 'Objectives / Description', type: 'textarea', span: 2 },
  ], [staff]);

  const {
    rows: departments, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch,
  } = useCrudTable<Department>('departments', {
    pageSize: PAGE_SIZE,
    searchColumns: ['name', 'head'],
  });
  // Separate unbounded fetch just for the total-employees sum — an aggregate
  // over the whole table, not one paginated page of it.
  const { rows: allDepartments } = useCrudTable<Department>('departments', { paginate: false });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', d?: Department) => {
    setDrawerMode(mode);
    setActiveDept(d ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeDept) return;
    const { error } = await remove(activeDept.id);
    if (error) { window.alert(`Could not delete department: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeDept
      ? await update(activeDept.id, values as Partial<Department>)
      : await insert(values as Omit<Department, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save department: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const totalEmployees = allDepartments.reduce((acc, d) => acc + d.employeeCount, 0);

  const columns: Column<Department>[] = [
    { key: 'name', label: 'Department', primary: true },
    { key: 'head', label: 'Head' },
    { key: 'employeeCount', label: 'Employees' },
    { key: 'budget', label: 'Budget' },
    { key: 'location', label: 'Location' },
  ];

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Departments</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage organizational structure, leadership, and budgets.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Department
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Departments</div>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#3B82F6' }}><Building size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{totalCount}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiTitle}>Total Employees</div>
            <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#10B981' }}><Users size={20} /></div>
          </div>
          <div className={styles.kpiValue}>{totalEmployees}</div>
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '24px', marginBottom: '24px' }}>
        <div className={styles.searchContainer} style={{ width: '300px', margin: 0 }}>
          <Search className={styles.searchIcon} size={16} />
          <input type="text" placeholder="Search departments..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
        <DataTable columns={columns} rows={departments} loading={loading} onRowClick={d => openDrawer('view', d)} emptyMessage="No departments found." />
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeDept}
        fields={fields}
        titleField="name"
        entityLabel="Department"
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

'use client';
import { usePagePermissions } from '@/lib/usePagePermissions';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import EntityDrawer, { FieldConfig } from '@/components/EntityDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Pagination from '@/components/Pagination';

type InventoryItem = {
  id: string;
  sku: string;
  itemName: string;
  quantity: number;
  warehouseLocation: string;
  reorderLevel: number;
  created_at?: string;
};

const PAGE_SIZE = 20;

const FIELDS: FieldConfig[] = [
  { key: 'sku', label: 'SKU', type: 'text', required: true, highlight: true },
  { key: 'itemName', label: 'Item Name', type: 'text', required: true },
  { key: 'quantity', label: 'Quantity on Hand', type: 'number', required: true, highlight: true },
  { key: 'reorderLevel', label: 'Reorder Alert Level', type: 'number', required: true },
  { key: 'warehouseLocation', label: 'Warehouse / Storage Location', type: 'text', required: true, span: 2, placeholder: 'e.g. Aisle 4, Shelf B' },
];

export default function WarehousePage() {
  const { canEdit, canDelete, canCreate } = usePagePermissions();
  const {
    rows: inventory, loading, insert, update, remove,
    totalCount, page, pageCount, setPage,
    search, setSearch, dateRange, setDateRange,
  } = useCrudTable<InventoryItem>('warehouse_items', {
    pageSize: PAGE_SIZE,
    searchColumns: ['itemName', 'sku'],
    dateColumn: 'created_at',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const openDrawer = (mode: 'view' | 'edit' | 'create', item?: InventoryItem) => {
    setDrawerMode(mode);
    setActiveItem(item ?? null);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    const { error } = await remove(activeItem.id);
    if (error) { window.alert(`Could not delete item: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (values: Record<string, string | number>) => {
    setSaving(true);
    const { error } = drawerMode === 'edit' && activeItem
      ? await update(activeItem.id, values as Partial<InventoryItem>)
      : await insert(values as Omit<InventoryItem, 'id'>);
    setSaving(false);
    if (error) { window.alert(`Could not save item: ${error.message}`); return; }
    setIsDrawerOpen(false);
  };

  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Warehouse Inventory</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage stock levels, locations, and reorder points.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className={styles.searchContainer} style={{ width: '250px' }}>
            <Search className={styles.searchIcon} size={16} />
            <input type="text" placeholder="Search inventory..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} onClick={() => openDrawer('create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {loading && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', background: 'white', borderRadius: '16px' }}>
            Loading…
          </div>
        )}
        {!loading && inventory.map((item) => (
          <div key={item.id} className={styles.panelCard} style={{ position: 'relative', cursor: 'pointer', border: item.quantity <= item.reorderLevel ? '1px solid #FCA5A5' : '' }} onClick={() => openDrawer('view', item)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{item.itemName}</h3>
                <span style={{ fontSize: '13px', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>{item.sku}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Stock Level</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: item.quantity <= item.reorderLevel ? '#DC2626' : '#1E3A8A' }}>
                  {item.quantity} Units {item.quantity <= item.reorderLevel && <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 500, marginLeft: '4px' }}>(Low)</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{item.warehouseLocation}</div>
              </div>
            </div>
          </div>
        ))}
        {!loading && inventory.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', background: 'white', borderRadius: '16px' }}>
            No inventory items found.
          </div>
        )}
      </div>

      <div className={styles.panelCard} style={{ padding: 0, marginTop: '24px' }}>
        <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <EntityDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        entity={activeItem}
        fields={FIELDS}
        titleField="itemName"
        entityLabel="Item"
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

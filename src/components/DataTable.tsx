'use client';
import { FolderOpen } from 'lucide-react';
import styles from './DataTable.module.css';

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  primary?: boolean;
};

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptySubtitle?: string;
};

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  loading,
  emptyMessage = 'No records found',
  emptySubtitle = 'Get started by creating a new record using the button above.',
}: DataTableProps<T>) {
  return (
    <div className={styles.tableResponsiveWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`}>
                {columns.map((col, cIdx) => (
                  <td key={`sk-${rIdx}-${col.key}`}>
                    <div
                      className={styles.skeletonCell}
                      style={{ width: cIdx === 0 ? '70%' : cIdx === columns.length - 1 ? '40%' : '55%' }}
                    />
                  </td>
                ))}
              </tr>
            ))
          )}

          {!loading && rows.map(row => (
            <tr key={row.id} className={onRowClick ? styles.clickableRow : undefined} onClick={() => onRowClick?.(row)}>
              {columns.map(col => (
                <td key={col.key} className={col.primary ? styles.primaryCell : undefined}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                <div className={styles.emptyContainer}>
                  <div className={styles.emptyIcon}>
                    <FolderOpen size={24} />
                  </div>
                  <div className={styles.emptyTitle}>{emptyMessage}</div>
                  <div className={styles.emptySubtitle}>{emptySubtitle}</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status, colors }: { status: string; colors: Record<string, { bg: string; text: string }> }) {
  const c = colors[status] ?? { bg: '#F1F5F9', text: '#475569' };
  return (
    <span className={styles.statusPill} style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

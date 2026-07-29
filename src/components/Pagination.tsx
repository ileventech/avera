'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageCount, totalCount, pageSize, onPageChange }: PaginationProps) {
  if (totalCount === 0) return null;

  const from = page * pageSize + 1;
  const to = Math.min(totalCount, page * pageSize + pageSize);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: '13px', color: '#64748B' }}>
        Showing {from}–{to} of {totalCount}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E9F2', background: 'white', color: page === 0 ? '#CBD5E1' : '#475569', fontSize: '13px', fontWeight: 500, cursor: page === 0 ? 'default' : 'pointer' }}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Page {page + 1} of {pageCount}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= pageCount}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E9F2', background: 'white', color: page + 1 >= pageCount ? '#CBD5E1' : '#475569', fontSize: '13px', fontWeight: 500, cursor: page + 1 >= pageCount ? 'default' : 'pointer' }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

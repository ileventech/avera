'use client';
import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import styles from './DateRangeFilter.module.css';

export type DateRange = { from: string | null; to: string | null };

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'All time', range: () => ({ from: null, to: null }) },
  { label: 'Today', range: () => { const d = toISO(new Date()); return { from: d, to: d }; } },
  { label: 'This week', range: () => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - day);
    const end = new Date(now); end.setDate(now.getDate() + (6 - day));
    return { from: toISO(start), to: toISO(end) };
  } },
  { label: 'This month', range: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toISO(start), to: toISO(end) };
  } },
  { label: 'This year', range: () => {
    const now = new Date();
    return { from: toISO(new Date(now.getFullYear(), 0, 1)), to: toISO(new Date(now.getFullYear(), 11, 31)) };
  } },
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatLabel(range: DateRange) {
  if (!range.from && !range.to) return 'All dates';
  if (range.from && range.to && range.from === range.to) return formatDate(range.from);
  if (range.from && range.to) return `${formatDate(range.from)} – ${formatDate(range.to)}`;
  if (range.from) return `From ${formatDate(range.from)}`;
  return `Until ${formatDate(range.to as string)}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const isActive = !!(value.from || value.to);

  return (
    <div className={styles.root} ref={rootRef}>
      <button type="button" className={`${styles.trigger} ${isActive ? styles.triggerActive : ''}`} onClick={() => setOpen(o => !o)}>
        <Calendar size={16} />
        <span>{formatLabel(value)}</span>
      </button>

      {open && (
        <div className={styles.popover}>
          <div className={styles.presets}>
            {PRESETS.map(p => (
              <button
                type="button"
                key={p.label}
                className={styles.presetBtn}
                onClick={() => { onChange(p.range()); setOpen(false); }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className={styles.customRange}>
            <label className={styles.customLabel}>
              From
              <input
                type="date"
                className={styles.dateInput}
                value={value.from ?? ''}
                onChange={e => onChange({ ...value, from: e.target.value || null })}
              />
            </label>
            <label className={styles.customLabel}>
              To
              <input
                type="date"
                className={styles.dateInput}
                value={value.to ?? ''}
                onChange={e => onChange({ ...value, to: e.target.value || null })}
              />
            </label>
          </div>
          {isActive && (
            <button type="button" className={styles.clearBtn} onClick={() => { onChange({ from: null, to: null }); setOpen(false); }}>
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}

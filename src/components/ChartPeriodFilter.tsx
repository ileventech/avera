import type { ChartPeriod } from '@/lib/groupByPeriod';

const PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: 'day',   label: 'Days' },
  { key: 'week',  label: 'Weeks' },
  { key: 'month', label: 'Months' },
  { key: 'year',  label: 'Years' },
];

export default function ChartPeriodFilter({
  value,
  onChange,
}: {
  value: ChartPeriod;
  onChange: (p: ChartPeriod) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#F1F5F9',
        borderRadius: '8px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '5px 11px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.15s ease',
            background: value === key ? 'white' : 'transparent',
            color: value === key ? '#0F172A' : '#64748B',
            boxShadow: value === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
          onMouseEnter={e => {
            if (value !== key) e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={e => {
            if (value !== key) e.currentTarget.style.color = '#64748B';
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

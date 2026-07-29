export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

export type ChartDataPoint = { label: string; amount: number };

/**
 * Groups an array of rows by a date field into chart-ready data points.
 * Supports day (last 30 days), week (last 12 weeks), month (last 12 months), year (all years).
 */
export function groupByPeriod<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  getValue: (row: T) => number,
  period: ChartPeriod
): ChartDataPoint[] {
  const now = new Date();
  const map = new Map<string, number>();

  for (const row of rows) {
    const dateStr = getDate(row);
    if (!dateStr) continue;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) continue;

    let key: string;
    switch (period) {
      case 'day': {
        key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      }
      case 'week': {
        // ISO week: find Monday of d's week
        const day = d.getDay(); // 0=Sun
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((day + 6) % 7));
        key = `W${getISOWeek(monday)}-${monday.getFullYear()}`;
        break;
      }
      case 'month': {
        key = d.toISOString().slice(0, 7); // YYYY-MM
        break;
      }
      case 'year': {
        key = String(d.getFullYear());
        break;
      }
    }

    map.set(key, (map.get(key) ?? 0) + getValue(row));
  }

  // Sort keys chronologically then map to display labels
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  return sorted.map(([key, amount]) => ({ label: keyToLabel(key, period), amount }));
}

function keyToLabel(key: string, period: ChartPeriod): string {
  switch (period) {
    case 'day': {
      const d = new Date(key + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    case 'week':
      // Already formatted as "W12-2026"
      return key.replace('-', ' \'').replace(/\d{4}$/, y => y.slice(2)); // "W12 '26"
    case 'month': {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    case 'year':
      return key;
  }
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

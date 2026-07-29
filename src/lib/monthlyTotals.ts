export function monthlyTotals<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  getAmount: (row: T) => number
): { month: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const date = getDate(row);
    if (!date) continue;
    const key = date.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + getAmount(row));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      const [y, m] = key.split('-').map(Number);
      return { month: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), amount };
    });
}

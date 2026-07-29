'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// For status/stage breakdown tiles and pie charts, which need counts per
// distinct value across the WHOLE table — independent of whatever page or
// filter the user currently has selected in the paginated list above it.
// Each count is a `head: true` request (zero rows transferred), made cheap
// by the (organization_id, status) composite index.
export function useStatusCounts(table: string, column: string, values: string[]) {
  const supabase = useMemo(() => createClient(), []);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const valuesKey = values.join('|');

  const refresh = useCallback(async () => {
    setLoading(true);
    const vals = valuesKey ? valuesKey.split('|') : [];
    try {
      const results = await Promise.all(
        vals.map(v => supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, v))
      );
      const next: Record<string, number> = {};
      vals.forEach((v, i) => { next[v] = results[i].count ?? 0; });
      setCounts(next);
    } catch {
      // Network or abort error — leave counts as-is, loading will clear
    } finally {
      setLoading(false);
    }
  }, [supabase, table, column, valuesKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { counts, loading, refresh };
}

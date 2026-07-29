'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Organization = {
  id: string;
  name: string;
  industry: string;
  team_size: string;
};

// RLS on `organizations` restricts SELECT to exactly the caller's own org row
// (handle_new_user() creates it at signup), so this is always a single-row
// lookup — no more "first row in the whole table" singleton hack.
export function useOrganization() {
  const supabase = useMemo(() => createClient(), []);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('organizations').select('id,name,industry,team_size').maybeSingle();
    setOrganization((data as Organization) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Every user's organization already exists by the time they can sign in
  // (created in handle_new_user()), so saving is always an update.
  const save = useCallback(async (values: { name: string; industry: string; team_size: string }) => {
    if (!organization) return { error: new Error('Organization not loaded yet.') };
    const { error } = await supabase.from('organizations').update(values).eq('id', organization.id);
    if (!error) await refresh();
    return { error };
  }, [supabase, organization, refresh]);

  return { organization, loading, save };
}

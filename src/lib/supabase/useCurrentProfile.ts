'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AppRole } from '../rbac';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export function useCurrentProfile(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}

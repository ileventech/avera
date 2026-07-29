'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
};

function toCurrentUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): CurrentUser | null {
  if (!user) return null;
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  return { id: user.id, email: user.email ?? '', fullName };
}

export function useCurrentUser() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(toCurrentUser(data.user));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toCurrentUser(session?.user ?? null));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}

export function initials(name: string, fallback: string): string {
  const source = name.trim() || fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

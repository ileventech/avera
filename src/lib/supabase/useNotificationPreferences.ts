'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type NotificationPreferences = {
  approvals: boolean;
  overdue_tasks: boolean;
  leave_requests: boolean;
};

const DEFAULTS: NotificationPreferences = { approvals: true, overdue_tasks: true, leave_requests: true };

export function useNotificationPreferences(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setPreferences(DEFAULTS); setLoading(false); return; }
    const { data } = await supabase.from('notification_preferences').select('approvals,overdue_tasks,leave_requests').eq('id', userId).maybeSingle();
    setPreferences(data ? (data as NotificationPreferences) : DEFAULTS);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const update = useCallback(async (values: Partial<NotificationPreferences>) => {
    if (!userId) return { error: 'Not signed in' };
    setPreferences(prev => ({ ...prev, ...values }));
    const { error } = await supabase.from('notification_preferences').upsert({ id: userId, ...values });
    return { error };
  }, [supabase, userId]);

  return { preferences, loading, update };
}

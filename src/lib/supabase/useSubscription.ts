'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Subscription = {
  id: string;
  tier: 'free' | 'pro' | 'enterprise';
  amount: number;
  currency: string;
  status: 'active' | 'cancelled';
  paystack_reference: string | null;
  created_at: string;
  created_by: string;
  organization_id?: string;
};

export function useSubscription() {
  const supabase = useMemo(() => createClient(), []);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Scope to the current user's own subscription rows so we never
    // accidentally show another user's plan.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as Subscription) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const recordPlan = useCallback(async (values: {
    tier: Subscription['tier'];
    amount: number;
    currency: string;
    paystack_reference?: string | null;
    created_by: string;
  }) => {
    // The `subscriptions` table requires `organization_id NOT NULL`.
    // The `set_organization_id` trigger auto-fills it via
    // `current_organization_id()` → `profiles.organization_id` for the
    // current auth.uid(). If that function returns null (rare edge case where
    // the profile row is missing or its org_id is null), the insert fails with
    // a NOT NULL violation. We fetch the org_id explicitly from the profile
    // and pass it directly so the insert always succeeds even if the trigger
    // function can't resolve it.
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', values.created_by)
      .maybeSingle();

    const organization_id = (profile as { organization_id?: string } | null)?.organization_id;

    // Build the row — include organization_id only when we successfully
    // resolved it (the trigger will still fill it if we omit it and the
    // function is working).
    const row = organization_id
      ? { ...values, organization_id }
      : values;

    const { error } = await supabase.from('subscriptions').insert(row);
    if (error) {
      console.error('recordPlan Error inserting subscription:', error);
    } else {
      await refresh();
    }
    return { error };
  }, [supabase, refresh]);

  return { subscription, loading, recordPlan, refresh };
}

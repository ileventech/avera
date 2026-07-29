'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Plan = {
  id: 'free' | 'starter' | 'professional' | 'enterprise';
  name: string;
  max_users: number;
  max_custom_roles: number;
  max_modules: number;
  price_monthly: number;
  features: string[];
};

export type PlanUsage = {
  plan: Plan | null;
  userCount: number;
  customRoleCount: number;
  loading: boolean;
  canAddUser: boolean;
  canAddCustomRole: boolean;
};

export function usePlan(userId: string | null): PlanUsage {
  const supabase = useMemo(() => createClient(), []);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [customRoleCount, setCustomRoleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    // Get current user's plan_id from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', userId)
      .maybeSingle();

    const planId = profile?.plan_id ?? 'free';

    // Load plan definition
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    // Count current users
    const { count: uCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Count custom roles
    const { count: rCount } = await supabase
      .from('custom_roles')
      .select('*', { count: 'exact', head: true });

    setPlan(planData as Plan ?? null);
    setUserCount(uCount ?? 0);
    setCustomRoleCount(rCount ?? 0);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { load(); }, [load]);

  const canAddUser = !plan || userCount < plan.max_users;
  const canAddCustomRole = !plan || customRoleCount < plan.max_custom_roles;

  return { plan, userCount, customRoleCount, loading, canAddUser, canAddCustomRole };
}

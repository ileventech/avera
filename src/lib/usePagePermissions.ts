'use client';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useActiveRole } from '@/lib/useActiveRole';
import { hasCrudPermission } from '@/lib/rbac';
import { createClient } from '@/utils/supabase/client';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';

type ProfilePermission = {
  path: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

/**
 * Returns canCreate/canEdit/canDelete/canRead for the current page and user.
 * Priority: profile-level override > role-level CRUD permission.
 */
export function usePagePermissions() {
  const { activeRole } = useActiveRole();
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [override, setOverride] = useState<ProfilePermission | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', user.id)
      .eq('path', pathname)
      .maybeSingle()
      .then(({ data }) => setOverride(data as ProfilePermission | null));
  }, [user?.id, pathname, supabase]);

  // Profile override takes full precedence
  if (override) {
    return {
      canCreate: override.can_create,
      canRead:   override.can_read,
      canEdit:   override.can_update,
      canDelete: override.can_delete,
      activeRole,
    };
  }

  // Fall back to role-level permissions
  return {
    canCreate: hasCrudPermission(activeRole, pathname, 'create'),
    canRead:   hasCrudPermission(activeRole, pathname, 'read'),
    canEdit:   hasCrudPermission(activeRole, pathname, 'update'),
    canDelete: hasCrudPermission(activeRole, pathname, 'delete'),
    activeRole,
  };
}

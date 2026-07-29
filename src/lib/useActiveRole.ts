'use client';
import { useState, useEffect } from 'react';
import { AppRole, ALL_ROLES } from './rbac';

const STORAGE_KEY = 'avera_active_role';
const EVENT_NAME = 'avera_role_changed';

export function getActiveRole(): AppRole {
  if (typeof window === 'undefined') return 'Administrator';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (ALL_ROLES as string[]).includes(saved)) {
    return saved as AppRole;
  }
  return 'Administrator';
}

export function setActiveRole(role: AppRole) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: role }));
}

export function useActiveRole(): { activeRole: AppRole; changeRole: (role: AppRole) => void } {
  const [role, setRole] = useState<AppRole>(() => getActiveRole());

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AppRole>;
      if (customEvent.detail) {
        setRole(customEvent.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return {
    activeRole: role,
    changeRole: setActiveRole,
  };
}

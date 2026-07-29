'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, Settings, LogOut, User, Menu } from 'lucide-react';
import styles from './crm.module.css';
import { createClient } from '@/utils/supabase/client';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import { useCurrentUser, initials } from '@/lib/supabase/useCurrentUser';
import { useMessages } from '@/lib/supabase/useMessages';
import { useNotificationPreferences } from '@/lib/supabase/useNotificationPreferences';
import { relativeDate } from '@/lib/relativeDate';
import MessagesPanel from '@/components/MessagesPanel';
import { useSidebar } from '@/components/SidebarContext';

type Approval = { id: string; title: string; date: string; status: 'Pending' | 'Approved' | 'Rejected' };
type Task = { id: string; title: string; status: 'To Do' | 'In Progress' | 'Completed'; dueDate: string };
type LeaveRequest = { id: string; employee: string; leaveType: string; startDate: string; status: 'Approved' | 'Pending' | 'Rejected' };

type Notification = { id: string; title: string; body: string; date: string; href: string };

import { useActiveRole } from '@/lib/useActiveRole';
import { ALL_ROLES, ROLE_DEFINITIONS } from '@/lib/rbac';

export default function TopHeader() {
  const router = useRouter();
  const { activeRole, changeRole } = useActiveRole();
  const currentRoleDef = ROLE_DEFINITIONS[activeRole];
  const supabase = useMemo(() => createClient(), []);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setIsOpen } = useSidebar();

  const { user } = useCurrentUser();
  // paginate: false — these need every row to compute the notification
  // badge/list, not one page of results.
  const { rows: approvals } = useCrudTable<Approval>('approvals', { paginate: false });
  const { rows: tasks } = useCrudTable<Task>('tasks', { paginate: false });
  const { rows: leaves } = useCrudTable<LeaveRequest>('leave_requests', { paginate: false });
  const { messages, loading: messagesLoading, unreadCount, markRead, send } = useMessages(user?.id ?? null);
  const { preferences: notifPrefs } = useNotificationPreferences(user?.id ?? null);

  const [messagesPanelOpen, setMessagesPanelOpen] = useState(false);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo<Notification[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const items: Notification[] = [];
    if (notifPrefs.approvals) {
      for (const a of approvals.filter(a => a.status === 'Pending')) {
        items.push({ id: `appr-${a.id}`, title: 'Approval Pending', body: a.title, date: a.date, href: '/approvals' });
      }
    }
    if (notifPrefs.overdue_tasks) {
      for (const t of tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < today)) {
        items.push({ id: `task-${t.id}`, title: 'Task Overdue', body: t.title, date: t.dueDate, href: '/tasks' });
      }
    }
    if (notifPrefs.leave_requests) {
      for (const l of leaves.filter(l => l.status === 'Pending')) {
        items.push({ id: `leave-${l.id}`, title: 'Leave Request Pending', body: `${l.employee} — ${l.leaveType}`, date: l.startDate, href: '/hr/leave' });
      }
    }
    return items.sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10);
  }, [approvals, tasks, leaves, notifPrefs]);

  const goTo = (href: string) => {
    setOpenDropdown(null);
    router.push(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = user?.fullName || user?.email || 'Account';

  return (
    <div className={styles.topBar}>
      {/* Mobile Menu Trigger Button */}
      <button 
        className={styles.mobileMenuBtn}
        onClick={() => setIsOpen(true)}
        title="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className={styles.topBarActions} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }} ref={containerRef}>

        {/* Live Role Switcher Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: currentRoleDef?.badgeBg ?? '#F1F5F9', padding: '4px 10px', borderRadius: '100px', border: `1px solid ${currentRoleDef?.badgeColor ?? '#64748B'}30` }} title="Switch role to test module permissions">
          <span style={{ fontSize: '11px', color: currentRoleDef?.badgeColor ?? '#64748B', fontWeight: 700 }}>Viewing as:</span>
          <select
            value={activeRole}
            onChange={e => changeRole(e.target.value as any)}
            style={{ background: 'transparent', border: 'none', color: currentRoleDef?.badgeColor ?? '#64748B', fontWeight: 700, fontSize: '12px', cursor: 'pointer', outline: 'none' }}
          >
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div className={styles.actionIcon} title="Notifications" onClick={() => toggleDropdown('notifications')}>
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></span>
            )}
          </div>
          {openDropdown === 'notifications' && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: 'white', border: '1px solid #E5E9F2', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #E5E9F2', fontWeight: 600 }}>
                Notifications {notifications.length > 0 && <span style={{ color: '#94A3B8', fontWeight: 500 }}>({notifications.length})</span>}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                    onClick={() => goTo(n.href)}
                    onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ color: '#0F172A', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{n.title}</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>{n.body}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{relativeDate(n.date)}</div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>You&apos;re all caught up.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages — opens right panel */}
        <div style={{ position: 'relative' }}>
          <div
            className={styles.actionIcon}
            title="Messages"
            onClick={() => { setOpenDropdown(null); setMessagesPanelOpen(o => !o); }}
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#3B82F6', borderRadius: '50%' }}></span>
            )}
          </div>
        </div>

        <MessagesPanel
          open={messagesPanelOpen}
          onClose={() => setMessagesPanelOpen(false)}
          messages={messages}
          loading={messagesLoading}
          unreadCount={unreadCount}
          markRead={markRead}
          send={send}
        />

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <div className={styles.userInfo} onClick={() => toggleDropdown('profile')} style={{ cursor: 'pointer' }}>
            <div>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userRole}>Account Settings</div>
            </div>
            <div className={styles.avatar}>{initials(user?.fullName ?? '', user?.email ?? '')}</div>
          </div>
          {openDropdown === 'profile' && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '220px', background: 'white', border: '1px solid #E5E9F2', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #E5E9F2' }}>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>{displayName}</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>{user?.email ?? ''}</div>
              </div>
                <div style={{ padding: '8px' }}>
                  <div style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '6px', color: '#475569', fontWeight: 500 }} onClick={() => goTo('/settings')} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><Settings size={16} /> Account Settings</div>
                  <div style={{ borderTop: '1px solid #E5E9F2', margin: '4px 0' }}></div>
                  <div style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', color: '#EF4444', fontWeight: 500 }} onClick={handleSignOut} onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><LogOut size={16} /> Sign Out</div>
                </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, X, Shield, Check, Pencil, Trash2, AlertTriangle, ChevronRight, Settings2 } from 'lucide-react';
import styles from '../../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';
import DataTable, { Column } from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { AppRole, ALL_ROLES, ROLE_DEFINITIONS, RoleDefinition, hasCrudPermission, CrudAction } from '@/lib/rbac';
import { createClient } from '@/utils/supabase/client';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { usePlan } from '@/lib/supabase/usePlan';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | string;
  created_at?: string;
};

type CustomRole = {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  badge_color: string;
  badge_bg: string;
  data_scope: 'All' | 'Personal';
  allowed_paths: string[];
  allowed_modules: string[];
  restricted_modules: string[];
  criteria: string[];
  crud_permissions: Record<string, CrudAction[]>; // path -> actions[]
  created_at?: string;
};

type ProfilePermission = {
  id?: string;
  path: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

const ALL_MODULE_PATHS = [
  { label: 'Dashboard',              path: '/dashboard' },
  { label: 'Tasks',                  path: '/tasks' },
  { label: 'Client CRM',             path: '/client' },
  { label: 'Projects',               path: '/projects' },
  { label: 'Projects – Buildings',   path: '/projects/buildings' },
  { label: 'Projects – Lands',       path: '/projects/lands' },
  { label: 'Projects – Blocks',      path: '/projects/blocks' },
  { label: 'Projects – Sites',       path: '/projects/sites' },
  { label: 'Projects – Locations',   path: '/projects/locations' },
  { label: 'Requests',               path: '/approvals' },
  { label: 'Departments',            path: '/department' },
  { label: 'Sales – Deals',          path: '/sales/sales' },
  { label: 'Sales – Plans',          path: '/sales/sale-plan' },
  { label: 'Sales – Leads',          path: '/sales/leads' },
  { label: 'Finance – Invoices',     path: '/finance/invoice' },
  { label: 'Finance – Expenditure',  path: '/finance/expenditure' },
  { label: 'Finance – Orders',       path: '/finance/order' },
  { label: 'Finance – Income',       path: '/finance/income' },
  { label: 'Finance – Payroll',      path: '/finance/payroll' },
  { label: 'HR – Staff',             path: '/hr/staff' },
  { label: 'HR – Attendance',        path: '/hr/attendance' },
  { label: 'HR – Leave',             path: '/hr/leave' },
  { label: 'HR – Holidays',          path: '/hr/holiday' },
  { label: 'Facility – Assets',      path: '/facility/assets' },
  { label: 'Facility – Warehouse',   path: '/facility/warehouse' },
  { label: 'Facility – Vendors',     path: '/facility/vendor' },
  { label: 'Facility – Agents',      path: '/facility/agent' },
  { label: 'Facility – Contractors', path: '/facility/contractor' },
  { label: 'User Management',        path: '/users/roles' },
  { label: 'Settings',               path: '/settings' },
];

const CRUD_ACTIONS: { label: string; key: keyof ProfilePermission; action: CrudAction }[] = [
  { label: 'View',   key: 'can_read',   action: 'read' },
  { label: 'Create', key: 'can_create', action: 'create' },
  { label: 'Edit',   key: 'can_update', action: 'update' },
  { label: 'Delete', key: 'can_delete', action: 'delete' },
];

const BADGE_COLORS = [
  { color: '#1E3A8A', bg: '#EFF6FF' },
  { color: '#059669', bg: '#F0FDF4' },
  { color: '#D97706', bg: '#FEF3C7' },
  { color: '#DB2777', bg: '#FCE7F3' },
  { color: '#047857', bg: '#ECFDF5' },
  { color: '#0369A1', bg: '#E0F2FE' },
  { color: '#475569', bg: '#F1F5F9' },
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#BE123C', bg: '#FFF1F2' },
];

const PAGE_SIZE = 20;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #E5E9F2',
  borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box',
  fontFamily: 'inherit', background: 'white',
};

function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0,
        border: `2px solid ${checked ? '#3B82F6' : '#D1D5DB'}`,
        background: checked ? '#3B82F6' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && <Check size={11} color="white" strokeWidth={3} />}
    </div>
  );
}

export default function RolesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useCurrentUser();
  const { plan, canAddUser, canAddCustomRole, userCount, customRoleCount } = usePlan(user?.id ?? null);

  const {
    rows: profiles, loading, update: updateProfile, refresh,
    totalCount, page, pageCount, setPage,
    search, setSearch,
  } = useCrudTable<Profile>('profiles', { pageSize: PAGE_SIZE, searchColumns: ['full_name', 'email'] });

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [activeTab, setActiveTab] = useState<'teammates' | 'roles'>('teammates');

  // ─── Invite ───────────────────────────────────────────────────────────────
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('Member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // ─── User Permission Panel ─────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userPerms, setUserPerms] = useState<ProfilePermission[]>([]);
  const [userPermsLoading, setUserPermsLoading] = useState(false);
  const [userPermsSaving, setUserPermsSaving] = useState(false);

  // ─── Role Editor ───────────────────────────────────────────────────────────
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleAudience, setRoleAudience] = useState('');
  const [roleScope, setRoleScope] = useState<'All' | 'Personal'>('All');
  const [roleColor, setRoleColor] = useState(BADGE_COLORS[0]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(['/dashboard']);
  // CRUD overrides per path: Record<path, {create,edit,delete}>
  const [crudPerms, setCrudPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState('');

  // ─── Derived ──────────────────────────────────────────────────────────────
  const allRoleNames = useMemo(() => [
    ...ALL_ROLES, ...customRoles.map(r => r.name),
  ], [customRoles]);

  const invitePreviewDef = useMemo((): Partial<RoleDefinition> | undefined => {
    const def = ROLE_DEFINITIONS[inviteRole as AppRole];
    if (def) return def;
    const cr = customRoles.find(r => r.name === inviteRole);
    if (!cr) return undefined;
    return {
      description: cr.description, targetAudience: cr.target_audience,
      badgeBg: cr.badge_bg, badgeColor: cr.badge_color,
      dataScope: cr.data_scope, allowedModules: cr.allowed_modules,
    };
  }, [inviteRole, customRoles]);

  const loadCustomRoles = useCallback(async () => {
    const { data } = await supabase.from('custom_roles').select('*').order('created_at', { ascending: false });
    setCustomRoles((data as CustomRole[]) ?? []);
  }, [supabase]);

  useEffect(() => { loadCustomRoles(); }, [loadCustomRoles]);

  // ─── User Permission Panel Helpers ────────────────────────────────────────
  const openUserPanel = useCallback(async (profile: Profile) => {
    setSelectedUser(profile);
    setUserPermsLoading(true);
    const { data } = await supabase
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', profile.id);
    setUserPerms((data as ProfilePermission[]) ?? []);
    setUserPermsLoading(false);
  }, [supabase]);

  const getEffectivePerm = (path: string): ProfilePermission => {
    const override = userPerms.find(p => p.path === path);
    if (override) return override;
    // Derive from role
    const role = selectedUser?.role as string;
    return {
      path,
      can_create: hasCrudPermission(role, path, 'create'),
      can_read:   hasCrudPermission(role, path, 'read'),
      can_update: hasCrudPermission(role, path, 'update'),
      can_delete: hasCrudPermission(role, path, 'delete'),
    };
  };

  const toggleUserPerm = (path: string, key: keyof ProfilePermission, value: boolean) => {
    setUserPerms(prev => {
      const existing = prev.find(p => p.path === path);
      if (existing) {
        return prev.map(p => p.path === path ? { ...p, [key]: value } : p);
      }
      const base = getEffectivePerm(path);
      return [...prev, { ...base, [key]: value }];
    });
  };

  const saveUserPerms = async () => {
    if (!selectedUser) return;
    setUserPermsSaving(true);
    for (const perm of userPerms) {
      await supabase.from('profile_permissions').upsert({
        profile_id: selectedUser.id,
        path: perm.path,
        can_create: perm.can_create,
        can_read: perm.can_read,
        can_update: perm.can_update,
        can_delete: perm.can_delete,
      }, { onConflict: 'profile_id,path' });
    }
    setUserPermsSaving(false);
    setSelectedUser(null);
  };

  // ─── Role Editor Helpers ──────────────────────────────────────────────────
  const openEditor = (role?: CustomRole) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name); setRoleDesc(role.description);
      setRoleAudience(role.target_audience); setRoleScope(role.data_scope);
      setSelectedPaths(role.allowed_paths);
      setRoleColor(BADGE_COLORS.find(c => c.color === role.badge_color) ?? BADGE_COLORS[0]);
      // Build crudPerms state from stored crud_permissions
      const cp: Record<string, Record<string, boolean>> = {};
      for (const [p, actions] of Object.entries(role.crud_permissions ?? {})) {
        cp[p] = {
          read: actions.includes('read'),
          create: actions.includes('create'),
          update: actions.includes('update'),
          delete: actions.includes('delete'),
        };
      }
      setCrudPerms(cp);
    } else {
      setEditingRole(null); setRoleName(''); setRoleDesc(''); setRoleAudience('');
      setRoleScope('All'); setSelectedPaths(['/dashboard']); setCrudPerms({});
      setRoleColor(BADGE_COLORS[0]);
    }
    setRoleError(''); setIsEditorOpen(true);
  };

  const togglePath = (path: string) => {
    setSelectedPaths(p => p.includes(path) ? p.filter(x => x !== path) : [...p, path]);
  };

  const toggleCrud = (path: string, action: string, value: boolean) => {
    setCrudPerms(prev => ({
      ...prev,
      [path]: { ...(prev[path] ?? { read: true, create: true, update: false, delete: false }), [action]: value },
    }));
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) { setRoleError('Role name is required.'); return; }
    if (selectedPaths.length === 0) { setRoleError('Select at least one module.'); return; }
    if (!editingRole && !canAddCustomRole) { setRoleError(`Your plan allows ${plan?.max_custom_roles ?? 0} custom roles. Upgrade to create more.`); return; }
    setRoleSaving(true); setRoleError('');

    // Build crud_permissions JSON: only include overrides for selected paths
    const crud_permissions: Record<string, CrudAction[]> = {};
    for (const path of selectedPaths) {
      const p = crudPerms[path];
      const actions: CrudAction[] = [];
      if (!p || p.read !== false) actions.push('read'); else if (p?.read) actions.push('read');
      if (!p || p.create !== false) actions.push('create'); else if (p?.create) actions.push('create');
      if (p?.update) actions.push('update');
      if (p?.delete) actions.push('delete');
      crud_permissions[path] = actions;
    }

    const allowedModules = ALL_MODULE_PATHS.filter(m => selectedPaths.includes(m.path)).map(m => m.label);
    const restrictedModules = ALL_MODULE_PATHS.filter(m => !selectedPaths.includes(m.path)).map(m => m.label);

    const payload = {
      name: roleName.trim(), description: roleDesc.trim(), target_audience: roleAudience.trim(),
      badge_color: roleColor.color, badge_bg: roleColor.bg, data_scope: roleScope,
      allowed_paths: selectedPaths, allowed_modules: allowedModules,
      restricted_modules: restrictedModules, criteria: [], crud_permissions,
    };

    const { error } = editingRole
      ? await supabase.from('custom_roles').update(payload).eq('id', editingRole.id)
      : await supabase.from('custom_roles').insert(payload);

    setRoleSaving(false);
    if (error) { setRoleError(error.message); return; }
    await loadCustomRoles();
    setIsEditorOpen(false);
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    await supabase.from('custom_roles').delete().eq('id', role.id);
    await loadCustomRoles();
  };

  const handleRoleChange = async (profile: Profile, role: string) => {
    const { error } = await updateProfile(profile.id, { role } as any);
    if (error) alert(`Could not update role: ${error.message}`);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddUser) { setInviteMsg({ type: 'error', text: `Plan limit: ${plan?.max_users ?? 5} users. Upgrade to invite more.` }); return; }
    setInviting(true); setInviteMsg(null);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, fullName: inviteName, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteMsg({ type: 'error', text: data.error || 'Could not send invite.' }); return; }
      setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail}.` });
      setInviteEmail(''); setInviteName(''); setInviteRole('Member');
      await refresh();
    } catch { setInviteMsg({ type: 'error', text: 'Network error.' }); }
    finally { setInviting(false); }
  };

  const getRoleBadge = (role: string) => {
    const def = ROLE_DEFINITIONS[role as AppRole];
    const cr = customRoles.find(r => r.name === role);
    return { bg: def?.badgeBg ?? cr?.badge_bg ?? '#F1F5F9', color: def?.badgeColor ?? cr?.badge_color ?? '#475569' };
  };

  const columns: Column<Profile>[] = [
    { key: 'full_name', label: 'Name', primary: true, render: p => p.full_name || '—' },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: p => {
        const { bg, color } = getRoleBadge(p.role);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: bg, color, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>{p.role}</span>
            <select value={p.role} onClick={e => e.stopPropagation()} onChange={e => handleRoleChange(p, e.target.value)}
              style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #E5E9F2', fontSize: '12px', background: 'white', cursor: 'pointer' }}>
              {allRoleNames.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        );
      }
    },
    {
      key: 'id', label: 'Permissions',
      render: p => (
        <button
          onClick={e => { e.stopPropagation(); openUserPanel(p); }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E5E9F2', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#475569', fontWeight: 600 }}
        >
          <Settings2 size={12} /> Adjust
        </button>
      ),
    },
    { key: 'created_at', label: 'Joined', render: p => p.created_at ? new Date(p.created_at).toLocaleDateString() : '—' },
  ];

  const planBadge = plan ? (
    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, background: '#F8FAFC', border: '1px solid #E5E9F2', padding: '4px 10px', borderRadius: '7px' }}>
      {plan.name} plan &nbsp;·&nbsp; {userCount}/{plan.max_users} users &nbsp;·&nbsp; {customRoleCount}/{plan.max_custom_roles} custom roles
    </span>
  ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.dashboardContent}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>User & Role Management</h1>
          <p style={{ color: '#64748B', fontSize: '13px', marginBottom: planBadge ? '8px' : '0' }}>Manage teammates, roles and module permissions.</p>
          {planBadge}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          {activeTab === 'roles' && (
            <button
              onClick={() => canAddCustomRole ? openEditor() : alert(`Upgrade to create more than ${plan?.max_custom_roles ?? 0} custom roles.`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: '#7C3AED', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px', opacity: canAddCustomRole ? 1 : 0.6 }}
            >
              <Plus size={15} /> New Role
            </button>
          )}
          <button
            onClick={() => canAddUser ? setIsInviteOpen(true) : alert(`Plan limit: ${plan?.max_users ?? 5} users.`)}
            className={styles.quickActionBtnPrimary}
            style={{ width: 'auto', padding: '9px 16px', borderRadius: '8px', opacity: canAddUser ? 1 : 0.6 }}
          >
            <Plus size={15} style={{ marginRight: '6px' }} /> Invite
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '2px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', width: 'fit-content', marginBottom: '20px' }}>
        {[{ k: 'teammates', label: 'Teammates' }, { k: 'roles', label: 'Roles & Permissions' }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k as any)} style={{
            padding: '6px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer',
            background: activeTab === t.k ? 'white' : 'transparent',
            color: activeTab === t.k ? '#0F172A' : '#64748B',
            boxShadow: activeTab === t.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Teammates Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'teammates' && (
        <>
          <div className={styles.panelCard} style={{ padding: '14px 20px', marginBottom: '14px' }}>
            <div className={styles.searchContainer} style={{ width: '280px', margin: 0 }}>
              <Search className={styles.searchIcon} size={15} />
              <input type="text" placeholder="Search teammates…" className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className={styles.panelCard} style={{ padding: '0', overflow: 'hidden' }}>
            <DataTable columns={columns} rows={profiles} loading={loading} emptyMessage="No teammates found." />
            <Pagination page={page} pageCount={pageCount} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ── Roles Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Built-in Roles */}
          <div className={styles.panelCard} style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '12px' }}>Built-in Roles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ALL_ROLES.map(role => {
                const def = ROLE_DEFINITIONS[role];
                return (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: def.badgeBg, color: def.badgeColor, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>{role}</span>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{def.description}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {['create', 'update', 'delete'].map(a => {
                        const has = def.allowedPaths.includes('*') || (!def.crudOverrides?.['*'] && role === 'Manager');
                        return (
                          <span key={a} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: has ? '#F0FDF4' : '#F8FAFC', color: has ? '#065F46' : '#94A3B8' }}>
                            {a === 'update' ? 'Edit' : a.charAt(0).toUpperCase() + a.slice(1)}
                          </span>
                        );
                      })}
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: def.dataScope === 'Personal' ? '#FEF3C7' : '#F0FDF4', color: def.dataScope === 'Personal' ? '#92400E' : '#065F46' }}>
                        {def.dataScope === 'Personal' ? 'Personal' : 'Full'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Roles */}
          <div className={styles.panelCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Custom Roles</div>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{customRoleCount}/{plan?.max_custom_roles ?? 0} used</span>
            </div>
            {customRoles.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', border: '1px dashed #E5E9F2', borderRadius: '8px' }}>
                No custom roles yet. Click <strong>New Role</strong> to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customRoles.map(role => (
                  <div key={role.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ background: role.badge_bg, color: role.badge_color, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', flexShrink: 0 }}>{role.name}</span>
                      <span style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.description || role.target_audience || 'Custom role'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{role.allowed_modules.length} modules</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: role.data_scope === 'Personal' ? '#FEF3C7' : '#F0FDF4', color: role.data_scope === 'Personal' ? '#92400E' : '#065F46' }}>
                        {role.data_scope === 'Personal' ? 'Personal' : 'Full'}
                      </span>
                      <button onClick={() => openEditor(role)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #E5E9F2', background: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => handleDeleteRole(role)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!canAddCustomRole && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#FEF3C7', borderRadius: '8px', fontSize: '13px', color: '#92400E' }}>
              <AlertTriangle size={15} /> Custom role limit reached on <strong>{plan?.name}</strong> plan. Upgrade to add more.
            </div>
          )}
        </div>
      )}

      {/* ─── User Permission Panel ─────────────────────────────────────────── */}
      {selectedUser && (
        <div className={styles.rightDrawerOverlay} onClick={() => setSelectedUser(null)}>
          <div className={styles.rightDrawer} style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.rightDrawerHeader}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700 }}>{selectedUser.full_name || selectedUser.email}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ ...getRoleBadge(selectedUser.role), fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: getRoleBadge(selectedUser.role).bg, color: getRoleBadge(selectedUser.role).color }}>{selectedUser.role}</span>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>{selectedUser.email}</span>
                </div>
              </div>
              <X size={18} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSelectedUser(null)} />
            </div>
            <div className={styles.rightDrawerContent}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                Adjust this user's permissions per module. Overrides their role defaults. Changes apply immediately when saved.
              </div>

              {userPermsLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Loading permissions…</div>
              ) : (
                <div style={{ border: '1px solid #E5E9F2', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Header Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: '0', background: '#F8FAFC', padding: '8px 14px', borderBottom: '1px solid #E5E9F2' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module</div>
                    {CRUD_ACTIONS.map(a => (
                      <div key={a.key} style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>{a.label}</div>
                    ))}
                  </div>

                  {/* Module Rows — show only modules the role has access to */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {ALL_MODULE_PATHS.filter(mod =>
                      hasCrudPermission(selectedUser.role, mod.path, 'read') ||
                      userPerms.some(p => p.path === mod.path)
                    ).map((mod, i) => {
                      const perm = getEffectivePerm(mod.path);
                      const isOverridden = userPerms.some(p => p.path === mod.path);
                      return (
                        <div key={mod.path} style={{
                          display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px',
                          padding: '10px 14px', borderBottom: i < ALL_MODULE_PATHS.length - 1 ? '1px solid #F1F5F9' : 'none',
                          background: isOverridden ? '#FFFBEB' : 'white', alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A' }}>{mod.label}</span>
                            {isOverridden && <span style={{ fontSize: '10px', fontWeight: 700, background: '#FDE68A', color: '#92400E', padding: '1px 5px', borderRadius: '4px' }}>Custom</span>}
                          </div>
                          {CRUD_ACTIONS.map(a => (
                            <div key={a.key} style={{ display: 'flex', justifyContent: 'center' }}>
                              <CheckBox
                                checked={perm[a.key] as boolean}
                                onChange={val => toggleUserPerm(mod.path, a.key, val)}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.rightDrawerFooter}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '9px 18px', borderRadius: '8px', background: 'white', border: '1px solid #E5E9F2', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Cancel</button>
              <button onClick={saveUserPerms} disabled={userPermsSaving} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '9px 18px', borderRadius: '8px', opacity: userPermsSaving ? 0.6 : 1, fontSize: '13px' }}>
                {userPermsSaving ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Invite Drawer ───────────────────────────────────────────────────── */}
      {isInviteOpen && (
        <div className={styles.rightDrawerOverlay} onClick={() => setIsInviteOpen(false)}>
          <div className={styles.rightDrawer} style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.rightDrawerHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Invite Teammate</h2>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setIsInviteOpen(false)} />
            </div>
            <div className={styles.rightDrawerContent}>
              <form id="inviteForm" onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inviteMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: '7px', fontSize: '13px', background: inviteMsg.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: inviteMsg.type === 'error' ? '#B91C1C' : '#065F46' }}>
                    {inviteMsg.text}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Full Name</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Sarah Jenkins" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Email Address</label>
                  <input style={inputStyle} type="email" placeholder="e.g. sarah@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Role</label>
                  <select style={inputStyle} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <optgroup label="Built-in Roles">{ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</optgroup>
                    {customRoles.length > 0 && <optgroup label="Custom Roles">{customRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</optgroup>}
                  </select>
                </div>
                {invitePreviewDef && (
                  <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Access Preview</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: invitePreviewDef.dataScope === 'Personal' ? '#FEF3C7' : '#F0FDF4', color: invitePreviewDef.dataScope === 'Personal' ? '#92400E' : '#065F46' }}>
                        {invitePreviewDef.dataScope === 'Personal' ? 'Personal data' : 'Full access'}
                      </span>
                    </div>
                    {invitePreviewDef.description && <div style={{ fontSize: '12px', color: '#64748B' }}>{invitePreviewDef.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {invitePreviewDef.allowedModules?.slice(0, 5).map((m, i) => (
                        <span key={i} style={{ background: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}>{m}</span>
                      ))}
                      {(invitePreviewDef.allowedModules?.length ?? 0) > 5 && <span style={{ fontSize: '11px', color: '#94A3B8' }}>+{(invitePreviewDef.allowedModules?.length ?? 0) - 5} more</span>}
                    </div>
                  </div>
                )}
              </form>
            </div>
            <div className={styles.rightDrawerFooter}>
              <button type="button" onClick={() => setIsInviteOpen(false)} style={{ padding: '9px 18px', borderRadius: '8px', background: 'white', border: '1px solid #E5E9F2', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Cancel</button>
              <button type="submit" form="inviteForm" disabled={inviting} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '9px 18px', borderRadius: '8px', opacity: inviting ? 0.6 : 1, fontSize: '13px' }}>
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Role Editor Drawer ───────────────────────────────────────────────── */}
      {isEditorOpen && (
        <div className={styles.rightDrawerOverlay} onClick={() => setIsEditorOpen(false)}>
          <div className={styles.rightDrawer} style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.rightDrawerHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 700 }}>{editingRole ? 'Edit Role' : 'New Custom Role'}</h2>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setIsEditorOpen(false)} />
            </div>
            <div className={styles.rightDrawerContent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roleError && <div style={{ padding: '10px 14px', borderRadius: '7px', fontSize: '13px', background: '#FEE2E2', color: '#B91C1C' }}>{roleError}</div>}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Role Name *</label>
                <input style={inputStyle} value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Support Agent" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Description</label>
                <input style={inputStyle} value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Brief description of this role." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>Target Audience</label>
                <input style={inputStyle} value={roleAudience} onChange={e => setRoleAudience(e.target.value)} placeholder="e.g. Customer Support Team" />
              </div>

              {/* Badge Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Badge Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {BADGE_COLORS.map((opt, i) => (
                    <button key={i} onClick={() => setRoleColor(opt)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: opt.color, border: roleColor.color === opt.color ? '3px solid #0F172A' : '2px solid transparent', cursor: 'pointer', outline: 'none' }} />
                  ))}
                  <span style={{ background: roleColor.bg, color: roleColor.color, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', marginLeft: '4px' }}>{roleName || 'Preview'}</span>
                </div>
              </div>

              {/* Data Scope */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Data Scope</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['All', 'Personal'] as const).map(scope => (
                    <button key={scope} onClick={() => setRoleScope(scope)} style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px', border: `2px solid ${roleScope === scope ? '#3B82F6' : '#E5E9F2'}`,
                      background: roleScope === scope ? '#EFF6FF' : 'white', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: roleScope === scope ? '#1E40AF' : '#0F172A' }}>
                        {scope === 'All' ? 'Full Visibility' : 'Personal Only'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {scope === 'All' ? 'All company records' : 'Own records only'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Module + CRUD Matrix */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Modules & Permissions <span style={{ color: '#94A3B8', fontWeight: 400 }}>({selectedPaths.length} selected)</span>
                </label>
                <div style={{ border: '1px solid #E5E9F2', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px 52px 52px', background: '#F8FAFC', padding: '7px 12px', borderBottom: '1px solid #E5E9F2' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Module</div>
                    {['Access', 'View', 'Create', 'Edit', 'Delete'].map(h => (
                      <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>{h}</div>
                    ))}
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {ALL_MODULE_PATHS.map((mod, i) => {
                      const enabled = selectedPaths.includes(mod.path);
                      const cp = crudPerms[mod.path] ?? { read: true, create: true, update: false, delete: false };
                      return (
                        <div key={mod.path} style={{
                          display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px 52px 52px',
                          padding: '8px 12px', borderBottom: i < ALL_MODULE_PATHS.length - 1 ? '1px solid #F1F5F9' : 'none',
                          background: enabled ? '#F0FDF4' : 'white', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: '13px', color: enabled ? '#0F172A' : '#94A3B8', fontWeight: enabled ? 500 : 400 }}>{mod.label}</span>
                          {/* Access toggle */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <CheckBox checked={enabled} onChange={() => togglePath(mod.path)} />
                          </div>
                          {/* View / Create / Edit / Delete — only active if module enabled */}
                          {(['read', 'create', 'update', 'delete'] as const).map(action => (
                            <div key={action} style={{ display: 'flex', justifyContent: 'center' }}>
                              <CheckBox
                                checked={enabled && (cp[action] ?? (action === 'read' || action === 'create'))}
                                onChange={val => { if (enabled) toggleCrud(mod.path, action, val); }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.rightDrawerFooter}>
              <button onClick={() => setIsEditorOpen(false)} style={{ padding: '9px 18px', borderRadius: '8px', background: 'white', border: '1px solid #E5E9F2', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSaveRole} disabled={roleSaving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: '#7C3AED', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px', opacity: roleSaving ? 0.6 : 1 }}>
                {roleSaving ? 'Saving…' : (editingRole ? 'Save Changes' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

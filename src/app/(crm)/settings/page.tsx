'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { useCurrentProfile } from '@/lib/supabase/useCurrentProfile';
import { useOrganization } from '@/lib/supabase/useOrganization';
import { useSubscription } from '@/lib/supabase/useSubscription';
import { useNotificationPreferences } from '@/lib/supabase/useNotificationPreferences';
import { useCurrencySetting, CURRENCY_OPTIONS } from '@/lib/useCurrency';
import { useActiveRole } from '@/lib/useActiveRole';
import styles from '../crm.module.css';

type Message = { type: 'success' | 'error'; text: string } | null;

const TIER_LABELS: Record<string, string> = { free: 'Basic (Free)', pro: 'Pro', enterprise: 'Enterprise' };

function Banner({ message }: { message: Message }) {
  if (!message) return null;
  const isError = message.type === 'error';
  return (
    <div style={{ color: isError ? '#EF4444' : '#059669', background: isError ? '#FEE2E2' : '#D1FAE5', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
      {message.text}
    </div>
  );
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: userLoading } = useCurrentUser();
  const { activeRole } = useActiveRole();
  const isAdmin = activeRole === 'Administrator';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  const [activeTab, setActiveTab] = useState<'account' | 'organization' | 'system'>('account');

  // Seeds the form once the user loads. This one-time sync from an external
  // source is exactly what the effect exists to do.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(user.fullName);
    setEmail(user.email);
  }, [user]);

  // Adjust active tab if user is demoted from Admin role during live switch
  useEffect(() => {
    if (!isAdmin && activeTab !== 'account') {
      setActiveTab('account');
    }
  }, [isAdmin, activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);

    const emailChanged = email !== user.email;
    const { error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email } : {}),
      data: { full_name: fullName },
    });
    if (authError) {
      setSavingProfile(false);
      setProfileMessage({ type: 'error', text: authError.message });
      return;
    }

    const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    setSavingProfile(false);
    if (profileError) {
      setProfileMessage({ type: 'error', text: profileError.message });
      return;
    }
    setProfileMessage({
      type: 'success',
      text: emailChanged ? 'Saved. Check your new email address to confirm the change.' : 'Saved.',
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message });
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setPasswordMessage({ type: 'success', text: 'Password updated.' });
  };

  return (
    <div className={styles.dashboardContent}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#64748B', fontSize: '14px' }}>Manage your account, notifications, and organization.</p>
      </div>

      {userLoading ? (
        <div style={{ color: '#94A3B8', fontSize: '14px' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #E5E9F2',
            paddingBottom: '0',
            marginBottom: '8px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setActiveTab('account')}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'account' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                color: activeTab === 'account' ? '#2563EB' : '#64748B',
                fontWeight: activeTab === 'account' ? 700 : 500,
                fontSize: '14.5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              My Account
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('organization')}
                  style={{
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'organization' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                    color: activeTab === 'organization' ? '#2563EB' : '#64748B',
                    fontWeight: activeTab === 'organization' ? 700 : 500,
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                >
                  Organization Profile
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  style={{
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'system' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                    color: activeTab === 'system' ? '#2563EB' : '#64748B',
                    fontWeight: activeTab === 'system' ? 700 : 500,
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                >
                  System Settings
                </button>
              </>
            )}
          </div>

          {/* Tab Content Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px', width: '100%' }}>
            {activeTab === 'account' && (
              <>
                <div className={styles.panelCard}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>Account Information</h3>
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Banner message={profileMessage} />
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Full Name</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }} />
                    </div>
                    <button type="submit" disabled={savingProfile} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', alignSelf: 'flex-start', opacity: savingProfile ? 0.6 : 1 }}>
                      {savingProfile ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                <div className={styles.panelCard}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>Security</h3>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Banner message={passwordMessage} />
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>New Password</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••••" style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }} />
                    </div>
                    <button type="submit" disabled={savingPassword} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', alignSelf: 'flex-start', opacity: savingPassword ? 0.6 : 1 }}>
                      {savingPassword ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </div>

                <NotificationPreferencesCard userId={user?.id ?? null} />
              </>
            )}

            {activeTab === 'organization' && isAdmin && (
              <>
                <CompanyProfileCard />
                <BillingCard />
              </>
            )}

            {activeTab === 'system' && isAdmin && (
              <>
                <CurrencySettingsCard />
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function NotificationPreferencesCard({ userId }: { userId: string | null }) {
  const { preferences, update } = useNotificationPreferences(userId);

  const toggle = (key: 'approvals' | 'overdue_tasks' | 'leave_requests', checked: boolean) => update({ [key]: checked });

  const row = (label: string, key: 'approvals' | 'overdue_tasks' | 'leave_requests') => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#0F172A' }}>{label}</span>
      <input type="checkbox" checked={preferences[key]} onChange={e => toggle(key, e.target.checked)} style={{ width: '18px', height: '18px' }} />
    </label>
  );

  return (
    <div className={styles.panelCard}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Notification Preferences</h3>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Choose which real events show up in your notification bell.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {row('Pending approvals', 'approvals')}
        {row('Overdue tasks', 'overdue_tasks')}
        {row('Pending leave requests', 'leave_requests')}
      </div>
    </div>
  );
}

function CurrencySettingsCard() {
  const { currency, saveCurrency, saving, message } = useCurrencySetting();
  const [selected, setSelected] = useState(currency.code);

  // Keep local select in sync when global currency loads from DB
  useEffect(() => { setSelected(currency.code); }, [currency.code]);

  const grouped = CURRENCY_OPTIONS.reduce<Record<string, typeof CURRENCY_OPTIONS>>((acc, opt) => {
    if (!acc[opt.region]) acc[opt.region] = [];
    acc[opt.region].push(opt);
    return acc;
  }, {});

  const handleSave = async () => {
    const opt = CURRENCY_OPTIONS.find(c => c.code === selected);
    if (opt) await saveCurrency(opt);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px', border: '1px solid #E5E9F2',
    borderRadius: '8px', background: 'white', fontSize: '14px',
  };

  return (
    <div className={styles.panelCard}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>System Currency</h3>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
        Sets the currency displayed across all modules, charts, and financial records. Admin-only.
      </p>

      {/* Preview */}
      <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Current</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            {new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(1250000)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{currency.label}</div>
        </div>
        <div style={{ fontSize: '32px', opacity: 0.15, fontWeight: 700 }}>{currency.code}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Choose Currency</label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={inputStyle}
          >
            {Object.entries(grouped).map(([region, opts]) => (
              <optgroup key={region} label={`── ${region} ──`}>
                {opts.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {message && (
          <div style={{ color: '#059669', background: '#D1FAE5', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={styles.quickActionBtnPrimary}
          style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Applying…' : 'Apply Currency'}
        </button>
      </div>
    </div>
  );
}

function CompanyProfileCard() {
  const { organization, loading, save } = useOrganization();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('real-estate');
  const [teamSize, setTeamSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!organization) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(organization.name);
    setIndustry(organization.industry || 'real-estate');
    setTeamSize(organization.team_size);
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await save({ name, industry, team_size: teamSize });
    setSaving(false);
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' });
  };

  return (
    <div className={styles.panelCard}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Company Profile</h3>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Visible only to Administrators.</p>
      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: '13px' }}>Loading…</div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Banner message={message} />
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Company Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Acme Real Estate Ltd" style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px', background: 'white' }}>
              <option value="real-estate">Real Estate</option>
              <option value="construction">Construction</option>
              <option value="property-management">Property Management</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Team Size</label>
            <select value={teamSize} onChange={e => setTeamSize(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px', background: 'white' }}>
              <option value="">Select team size...</option>
              <option value="1-5">1–5 people</option>
              <option value="6-20">6–20 people</option>
              <option value="21-50">21–50 people</option>
              <option value="51-100">51–100 people</option>
              <option value="100+">100+ people</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}

const TIER_BADGE: Record<string, { bg: string; color: string }> = {
  free: { bg: '#F1F5F9', color: '#475569' },
  pro: { bg: '#EFF6FF', color: '#2563EB' },
  enterprise: { bg: '#FEF3C7', color: '#D97706' },
};

function BillingCard() {
  const { subscription, loading } = useSubscription();
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

  // Derive effective plan — free is the implicit default when no row exists
  const tier = subscription?.tier ?? 'free';
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const badge = TIER_BADGE[tier] ?? TIER_BADGE.free;

  return (
    <div className={styles.panelCard}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Billing &amp; Subscription</h3>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Visible only to Administrators.</p>
      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: '13px' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Plan summary card */}
          <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E5E9F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Current Plan</div>
              <span style={{ background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {tierLabel}
              </span>
            </div>

            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              {tierLabel}
            </div>

            {subscription ? (
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                {formatCurrency(subscription.amount)}/mo &middot;&nbsp;
                <span style={{ color: subscription.status === 'active' ? '#059669' : '#DC2626', fontWeight: 600 }}>
                  {subscription.status === 'active' ? 'Active' : 'Cancelled'}
                </span>
                &nbsp;&middot; Since {new Date(subscription.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Free plan &middot; <span style={{ color: '#059669', fontWeight: 600 }}>Active</span>
                &nbsp;&middot; Upgrade anytime to unlock more features
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/payment"
              className={styles.quickActionBtnPrimary}
              style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '14px' }}
            >
              {tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

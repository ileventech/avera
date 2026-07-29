'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Home } from 'lucide-react';
import { useActiveRole } from '@/lib/useActiveRole';
import { hasModuleAccess, ROLE_DEFINITIONS } from '@/lib/rbac';

export default function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeRole } = useActiveRole();
  const isAllowed = hasModuleAccess(activeRole, pathname);
  const roleDef = ROLE_DEFINITIONS[activeRole];

  if (!isAllowed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)' }}>
          <ShieldAlert size={32} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Access Restricted</h1>
        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '460px', lineHeight: '1.6', marginBottom: '20px' }}>
          Your active role (<strong style={{ color: roleDef?.badgeColor ?? '#1E3A8A' }}>{activeRole}</strong>) does not have permission to view or manage the <strong>{pathname}</strong> module.
        </p>

        <div style={{ background: '#F8FAFC', border: '1px solid #E5E9F2', padding: '16px 20px', borderRadius: '12px', textAlign: 'left', maxWidth: '460px', width: '100%', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Allowed Modules for {activeRole}:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {roleDef?.allowedModules.map((m, i) => (
              <span key={i} style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px' }}>
                ✓ {m}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: 'white', fontWeight: 600, borderRadius: '10px', textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

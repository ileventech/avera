'use client';
import { useState, useEffect, useMemo } from 'react';
import { Home, ClipboardList, User, Inbox, Building2, PieChart, TrendingUp, Users, Factory, Wrench, Settings, LogOut, ChevronDown, ChevronsLeft, ChevronsRight, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './crm.module.css';
import { createClient } from '@/utils/supabase/client';

const menuItems = [
  { name: 'Dashboard', icon: <Home size={16} />, path: '/dashboard' },
  { name: 'Tasks', icon: <ClipboardList size={16} />, path: '/tasks' },
  { name: 'Client', icon: <User size={16} />, path: '/client' },
  {
    name: 'Projects',
    icon: <Briefcase size={16} />,
    type: 'dropdown',
    subItems: [
      { name: 'All Projects', path: '/projects' },
      { name: 'Buildings', path: '/projects/buildings' },
      { name: 'Lands', path: '/projects/lands' },
      { name: 'Blocks', path: '/projects/blocks' },
      { name: 'Sites', path: '/projects/sites' },
      { name: 'Locations', path: '/projects/locations' },
    ],
  },
  { name: 'Requests', icon: <Inbox size={16} />, path: '/approvals' },
  { name: 'Department', icon: <Building2 size={16} />, path: '/department' },
  {
    name: 'Finance',
    icon: <PieChart size={16} />,
    type: 'dropdown',
    subItems: [
      { name: 'Invoice', path: '/finance/invoice' },
      { name: 'Expenditure', path: '/finance/expenditure' },
      { name: 'Order', path: '/finance/order' },
      { name: 'Income', path: '/finance/income' },
      { name: 'Payroll', path: '/finance/payroll' },
    ],
  },
  {
    name: 'Sales',
    icon: <TrendingUp size={16} />,
    type: 'dropdown',
    subItems: [
      { name: 'Sales', path: '/sales/sales' },
      { name: 'Sale plan', path: '/sales/sale-plan' },
      { name: 'Leads', path: '/sales/leads' },
    ],
  },
  {
    name: 'HR',
    icon: <Users size={16} />,
    type: 'dropdown',
    subItems: [
      { name: 'Staff', path: '/hr/staff' },
      { name: 'Attendance', path: '/hr/attendance' },
      { name: 'Leave', path: '/hr/leave' },
      { name: 'Holiday', path: '/hr/holiday' },
    ],
  },
  {
    name: 'Facility',
    icon: <Factory size={16} />,
    type: 'dropdown',
    subItems: [
      { name: 'Assets', path: '/facility/assets' },
      { name: 'Warehouse', path: '/facility/warehouse' },
      { name: 'Vendor', path: '/facility/vendor' },
      { name: 'Agent', path: '/facility/agent' },
      { name: 'Contractor', path: '/facility/contractor' },
    ],
  },
  { name: 'User Mgmt', icon: <Wrench size={16} />, type: 'dropdown', subItems: [{ name: 'Roles', path: '/users/roles' }] },
  { name: 'Settings', icon: <Settings size={16} />, path: '/settings' },
];

import { useActiveRole } from '@/lib/useActiveRole';
import { hasModuleAccess } from '@/lib/rbac';
import { useSidebar } from '@/components/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { activeRole } = useActiveRole();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { isOpen, setIsOpen } = useSidebar();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Filter menuItems according to activeRole permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (item.type === 'dropdown' && item.subItems) {
      return item.subItems.some(sub => hasModuleAccess(activeRole, sub.path));
    }
    return item.path ? hasModuleAccess(activeRole, item.path) : false;
  });

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.type === 'dropdown' && item.subItems?.some(sub => pathname === sub.path)) {
        initialExpanded[item.name] = true;
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
    // Auto-close sidebar on mobile when navigating
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        style={{
          width: collapsed ? '60px' : '230px',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          minWidth: collapsed ? '60px' : '230px',
        }}
      >
        {/* Header */}
        <div className={styles.sidebarHeader} style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: '16px 10px 12px', overflow: 'hidden' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>A</div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#1E3A8A', whiteSpace: 'nowrap' }}>Avera</span>
            </div>
          )}
          {collapsed && (
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '15px' }}>A</div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            className={styles.collapseToggleBtn}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', padding: '4px', borderRadius: '6px', flexShrink: 0, marginLeft: collapsed ? '0' : 'auto' }}
            onMouseOver={e => (e.currentTarget.style.color = '#1E3A8A')}
            onMouseOut={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {/* Nav Items */}
        <div className={styles.navSection} style={{ padding: collapsed ? '0 6px' : '0 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {visibleMenuItems.map((item, index) => {
            const visibleSubItems = item.subItems?.filter(sub => hasModuleAccess(activeRole, sub.path));
            const isActive = pathname === item.path || (visibleSubItems && visibleSubItems.some(sub => pathname === sub.path));
            const isExpanded = expandedMenus[item.name] && !collapsed;

            if (item.type === 'dropdown') {
              return (
                <div key={index} className={styles.navItemContainer} title={collapsed ? item.name : undefined}>
                  <div
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 10px' }}
                    onClick={() => !collapsed && toggleMenu(item.name)}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.name}</span>
                        <ChevronDown className={`${styles.chevron} ${isExpanded ? styles.open : ''}`} size={14} />
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <div className={styles.subMenuContainer}>
                      {visibleSubItems?.map((sub, i) => (
                        <Link key={i} href={sub.path} className={`${styles.subMenuItem} ${pathname === sub.path ? styles.active : ''}`}>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={index} className={styles.navItemContainer} title={collapsed ? item.name : undefined}>
                <Link
                  href={item.path || '#'}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 10px' }}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {!collapsed && <span className={styles.navLabel}>{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer — Pinned to the bottom of the sidebar */}
        <div style={{ padding: collapsed ? '12px 6px' : '12px 8px', borderTop: '1px solid #E5E9F2', marginTop: 'auto' }}>
          <div className={styles.navItemContainer}>
            <button
              onClick={handleSignOut}
              className={styles.navItem}
              title={collapsed ? 'Log out' : undefined}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 10px', color: '#EF4444', gap: '6px' }}
            >
              <span className={styles.icon} style={{ width: '16px' }}><LogOut size={16} /></span>
              {!collapsed && <span className={styles.navLabel}>Log out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

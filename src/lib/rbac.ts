export type AppRole =
  | 'Administrator'
  | 'Manager'
  | 'Sales Representative'
  | 'HR & Payroll Specialist'
  | 'Finance & Accounting Specialist'
  | 'Facility & Logistics Manager'
  | 'Member';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';
export type DataScope = 'All' | 'Personal';

export type RoleDefinition = {
  name: AppRole;
  badgeBg: string;
  badgeColor: string;
  description: string;
  targetAudience: string;
  dataScope: DataScope;
  allowedPaths: string[];
  allowedModules: string[];
  restrictedModules: string[];
  criteria: string[];
  // CRUD permission overrides per path — default is ['create','read'] for Member
  crudOverrides?: Partial<Record<string, CrudAction[]>>;
};

export const ALL_ROLES: AppRole[] = [
  'Administrator',
  'Manager',
  'Sales Representative',
  'HR & Payroll Specialist',
  'Finance & Accounting Specialist',
  'Facility & Logistics Manager',
  'Member',
];

// Full CRUD shorthand
const FULL: CrudAction[] = ['create', 'read', 'update', 'delete'];
// Read + Create (no edit/delete)
const CREATE_ONLY: CrudAction[] = ['create', 'read'];
// Read only
const READ_ONLY: CrudAction[] = ['read'];

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  Administrator: {
    name: 'Administrator',
    badgeBg: '#EFF6FF',
    badgeColor: '#1E3A8A',
    description: 'Full access to all modules, settings and user management.',
    targetAudience: 'Company Owners, C-Suite, IT Directors',
    dataScope: 'All',
    allowedPaths: ['*'],
    allowedModules: ['Dashboard', 'Tasks', 'Client', 'Requests', 'Department', 'Finance (All)', 'Sales (All)', 'HR (All)', 'Facility (All)', 'User Management', 'Settings'],
    restrictedModules: [],
    criteria: ['Full CRUD on all modules', 'Can invite & manage all users', 'Can modify organization settings'],
  },
  Manager: {
    name: 'Manager',
    badgeBg: '#F0FDF4',
    badgeColor: '#059669',
    description: 'Team & departmental management with full edit access.',
    targetAudience: 'Department Heads, Operations Managers, Team Leads',
    dataScope: 'All',
    allowedPaths: [
      '/dashboard', '/tasks', '/client', '/approvals', '/department',
      '/sales/sales', '/sales/sale-plan', '/sales/leads',
      '/hr/staff', '/hr/attendance', '/hr/leave', '/hr/holiday',
      '/facility/assets', '/facility/warehouse', '/facility/vendor', '/facility/agent', '/facility/contractor',
      '/projects', '/projects/buildings', '/projects/lands', '/projects/blocks',
    ],
    allowedModules: ['Dashboard', 'Tasks', 'Client', 'Requests', 'Department', 'Sales (Deals, Plans, Leads)', 'HR (Staff, Attendance, Leave)', 'Facility (Assets, Warehouse, Vendors)', 'Projects'],
    restrictedModules: ['Finance Payroll', 'User Management', 'Settings'],
    criteria: ['Full CRUD on team tasks, requests and department records', 'Can approve leave and manage staff', 'No access to payroll or admin settings'],
  },
  'Sales Representative': {
    name: 'Sales Representative',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    description: 'CRM and sales pipeline access. Can create records, edit/delete only own entries.',
    targetAudience: 'Account Executives, Sales Reps, Business Development',
    dataScope: 'All',
    allowedPaths: [
      '/dashboard', '/tasks', '/client', '/approvals',
      '/sales/sales', '/sales/sale-plan', '/sales/leads',
      '/projects', '/projects/buildings', '/projects/lands', '/projects/blocks',
    ],
    allowedModules: ['Dashboard', 'Tasks', 'Client CRM', 'Requests', 'Sales (Deals, Plans, Leads)', 'Projects'],
    restrictedModules: ['Department', 'Finance', 'HR', 'Facility', 'User Management', 'Settings'],
    criteria: ['Can create clients, leads and deals', 'Can only edit/delete their own records', 'No access to finance, HR or facility data'],
    crudOverrides: {
      '/client': CREATE_ONLY,
      '/sales/leads': CREATE_ONLY,
      '/projects': READ_ONLY,
      '/projects/buildings': READ_ONLY,
      '/projects/lands': READ_ONLY,
      '/projects/blocks': READ_ONLY,
    },
  },
  'HR & Payroll Specialist': {
    name: 'HR & Payroll Specialist',
    badgeBg: '#FCE7F3',
    badgeColor: '#DB2777',
    description: 'Manages staff records, payroll, attendance and leave.',
    targetAudience: 'HR Managers, Talent Ops, Payroll Officers',
    dataScope: 'All',
    allowedPaths: [
      '/dashboard', '/tasks', '/approvals', '/department',
      '/hr/staff', '/hr/attendance', '/hr/leave', '/hr/holiday',
      '/finance/payroll',
    ],
    allowedModules: ['Dashboard', 'Tasks', 'Requests', 'Department', 'HR (Staff, Attendance, Leave, Holidays)', 'Finance Payroll'],
    restrictedModules: ['Client CRM', 'Sales Pipeline', 'Facility', 'Invoices & Income', 'User Management', 'Settings'],
    criteria: ['Full CRUD on HR records and payroll', 'Can approve leave requests', 'No access to sales or facility data'],
  },
  'Finance & Accounting Specialist': {
    name: 'Finance & Accounting Specialist',
    badgeBg: '#ECFDF5',
    badgeColor: '#047857',
    description: 'Full financial records access — invoices, orders, income, payroll.',
    targetAudience: 'Accountants, Controllers, Billing Specialists',
    dataScope: 'All',
    allowedPaths: [
      '/dashboard', '/tasks', '/approvals',
      '/finance/invoice', '/finance/expenditure', '/finance/order', '/finance/income', '/finance/payroll',
      '/projects', '/projects/buildings', '/projects/lands', '/projects/blocks',
    ],
    allowedModules: ['Dashboard', 'Tasks', 'Requests', 'Finance (Invoices, Expenditure, Orders, Income, Payroll)', 'Projects'],
    restrictedModules: ['Client CRM', 'Department', 'Sales Deals', 'HR Details', 'Facility', 'User Management', 'Settings'],
    criteria: ['Full CRUD on billing, invoicing and financial records', 'Can manage payroll', 'No access to HR profiles or settings'],
  },
  'Facility & Logistics Manager': {
    name: 'Facility & Logistics Manager',
    badgeBg: '#E0F2FE',
    badgeColor: '#0369A1',
    description: 'Infrastructure and supply chain management.',
    targetAudience: 'Facility Directors, Logistics Leads, Office Managers',
    dataScope: 'All',
    allowedPaths: [
      '/dashboard', '/tasks', '/approvals', '/department',
      '/facility/assets', '/facility/warehouse', '/facility/vendor', '/facility/agent', '/facility/contractor',
      '/projects', '/projects/buildings', '/projects/lands', '/projects/blocks',
    ],
    allowedModules: ['Dashboard', 'Tasks', 'Requests', 'Department', 'Facility (Assets, Warehouse, Vendors, Agents, Contractors)', 'Projects'],
    restrictedModules: ['Client CRM', 'Finance', 'Sales', 'HR Directory', 'User Management', 'Settings'],
    criteria: ['Full CRUD on assets, warehouse and vendors', 'Can track contractors and agents', 'No access to finance or HR salary data'],
  },
  Member: {
    name: 'Member',
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
    description: 'Standard employee. Sees only their own records — tasks, requests and personal HR.',
    targetAudience: 'General Employees, Staff Members',
    dataScope: 'Personal',
    allowedPaths: [
      '/dashboard', '/tasks', '/approvals',
      '/hr/attendance', '/hr/leave', '/hr/holiday',
      '/projects', '/projects/buildings', '/projects/lands', '/projects/blocks',
    ],
    allowedModules: ['Dashboard', 'Tasks (Assigned to me)', 'Requests (My submissions)', 'HR (My Attendance & Leave)', 'Projects'],
    restrictedModules: ['Client CRM', 'Department', 'Finance', 'Sales', 'HR Directory', 'Facility', 'User Management', 'Settings'],
    criteria: ['Can create tasks, submit requests and apply for leave', 'Cannot edit or delete others records', 'Sees only own data across all modules'],
    crudOverrides: {
      '/tasks': CREATE_ONLY,
      '/approvals': CREATE_ONLY,
      '/hr/attendance': READ_ONLY,
      '/hr/leave': CREATE_ONLY,
      '/projects': READ_ONLY,
      '/projects/buildings': READ_ONLY,
      '/projects/lands': READ_ONLY,
      '/projects/blocks': READ_ONLY,
    },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function hasModuleAccess(role: AppRole | string, path: string): boolean {
  const def = ROLE_DEFINITIONS[role as AppRole];
  if (!def) return true;
  if (def.allowedPaths.includes('*')) return true;
  return def.allowedPaths.some(p => path === p || path.startsWith(`${p}/`));
}

export function hasCrudPermission(
  role: AppRole | string,
  path: string,
  action: CrudAction
): boolean {
  const def = ROLE_DEFINITIONS[role as AppRole];
  if (!def) return true;
  if (def.allowedPaths.includes('*')) return true; // Administrator

  // Check for an explicit override for this path or a parent path
  if (def.crudOverrides) {
    for (const [overridePath, actions] of Object.entries(def.crudOverrides)) {
      if (path === overridePath || path.startsWith(`${overridePath}/`)) {
        return (actions ?? []).includes(action);
      }
    }
  }

  // Default for Manager role: full CRUD
  if (role === 'Manager' || role === 'Administrator') return true;

  // Default for other roles that have access: full CRUD (unless overridden)
  if (def.allowedPaths.some(p => path === p || path.startsWith(`${p}/`))) return true;

  return false;
}

export function filterByRoleOwnership<T extends Record<string, any>>(
  rows: T[],
  role: AppRole | string,
  userNameOrEmail?: string
): T[] {
  const def = ROLE_DEFINITIONS[role as AppRole];
  if (!def || def.dataScope === 'All' || !userNameOrEmail) return rows;

  const query = userNameOrEmail.toLowerCase().trim();

  return rows.filter(row => {
    const assignee = String(row.assignee ?? '').toLowerCase();
    const employee = String(row.employee ?? '').toLowerCase();
    const requester = String(row.requester ?? '').toLowerCase();
    const email = String(row.email ?? '').toLowerCase();
    const fullName = String(row.full_name ?? '').toLowerCase();
    const assignedTo = String(row.assignedTo ?? '').toLowerCase();

    if (assignee && assignee.includes(query)) return true;
    if (employee && employee.includes(query)) return true;
    if (requester && requester.includes(query)) return true;
    if (email && email === query) return true;
    if (fullName && fullName.includes(query)) return true;
    if (assignedTo && assignedTo.includes(query)) return true;
    if (row.type === 'Public' || row.type === 'Company') return true;

    return false;
  });
}

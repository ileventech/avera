'use client';
import { useMemo, useState } from 'react';
import {
  X, Edit2, Trash2, Calendar, Plus, User, CheckSquare,
  Square, Flag, Search, Filter, Clock, AlertTriangle, CheckCircle2,
  Loader2, LayoutGrid, List,
} from 'lucide-react';
import styles from '../crm.module.css';
import { useCrudTable } from '@/lib/supabase/useCrudTable';

type ChecklistItem = { text: string; done: boolean };

// DB uses quoted camelCase columns — Supabase returns them as camelCase JS keys.
// Some older rows may have null for optional fields so we always guard.
type Task = {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  priority: 'High Priority' | 'Medium' | 'Low' | null;
  status: 'To Do' | 'In Progress' | 'Completed';
  assignee: string | null;
  assigneeColor: string | null;
  subtasks: string[] | null;
  checklists: string[] | null;   // stored as JSON strings
  blockingTask: string | null;
  waitingTask: string | null;
  created_at?: string;
};

const PRIORITY_CONFIG = {
  'High Priority': { color: '#EF4444', bg: '#FEE2E2', label: 'High', icon: AlertTriangle },
  'Medium':        { color: '#F59E0B', bg: '#FEF3C7', label: 'Medium', icon: Flag },
  'Low':           { color: '#10B981', bg: '#D1FAE5', label: 'Low', icon: Flag },
};

const STATUS_CONFIG = {
  'To Do':       { color: '#64748B', bg: '#F1F5F9', header: '#E2E8F0' },
  'In Progress': { color: '#2563EB', bg: '#EFF6FF', header: '#DBEAFE' },
  'Completed':   { color: '#059669', bg: '#F0FDF4', header: '#D1FAE5' },
};

const ASSIGNEE_COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4'];

function parseCL(raw: string[]): ChecklistItem[] {
  return (raw ?? []).map(s => {
    try { return JSON.parse(s) as ChecklistItem; } catch { return { text: s, done: false }; }
  });
}

function serializeCL(items: ChecklistItem[]): string[] {
  return items.map(i => JSON.stringify(i));
}

function dueBadge(dueDate: string, status: Task['status']) {
  if (!dueDate || status === 'Completed') return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#EF4444', bg: '#FEE2E2' };
  if (diff === 0) return { label: 'Due today', color: '#F59E0B', bg: '#FEF3C7' };
  if (diff <= 3) return { label: `${diff}d left`, color: '#3B82F6', bg: '#EFF6FF' };
  return null;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E5E9F2',
  borderRadius: '8px', outline: 'none', fontSize: '14px',
  background: 'white', color: '#0F172A', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

import { useActiveRole } from '@/lib/useActiveRole';
import { filterByRoleOwnership } from '@/lib/rbac';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';

export default function TasksPage() {
  const { activeRole } = useActiveRole();
  const { user } = useCurrentUser();
  const { rows: tasks, loading, insert, update, remove } = useCrudTable<Task>('tasks', { paginate: false });
  const { rows: staff } = useCrudTable<any>('staff', { paginate: false });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [status, setStatus] = useState<Task['status']>('To Do');
  const [assignee, setAssignee] = useState('');
  const [assigneeColor, setAssigneeColor] = useState(ASSIGNEE_COLORS[0]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [blockingTask, setBlockingTask] = useState('');
  const [waitingTask, setWaitingTask] = useState('');

  const openDrawer = (mode: 'view' | 'edit' | 'create', t?: Task, defaultStatus: Task['status'] = 'To Do') => {
    setDrawerMode(mode);
    setActiveTask(t ?? null);
    setTitle(t?.title ?? '');
    setDescription(t?.description ?? '');
    setStartDate(t?.startDate ?? '');
    setDueDate(t?.dueDate ?? '');
    setPriority(t?.priority ?? 'Medium');
    setStatus(t?.status ?? defaultStatus);
    setAssignee(t?.assignee ?? '');
    setAssigneeColor(t?.assigneeColor ?? ASSIGNEE_COLORS[0]);
    setSubtasks(t?.subtasks ?? []);
    setChecklistItems(parseCL(t?.checklists ?? []));
    setBlockingTask(t?.blockingTask ?? '');
    setWaitingTask(t?.waitingTask ?? '');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleDelete = async () => {
    if (!activeTask || !window.confirm('Delete this task? This cannot be undone.')) return;
    const { error } = await remove(activeTask.id);
    if (error) { window.alert(`Could not delete task: ${error.message}`); return; }
    closeDrawer();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const values = {
      title: title.trim(), description, startDate, dueDate, priority, status,
      subtasks, checklists: serializeCL(checklistItems),
      blockingTask, waitingTask,
      assignee: assignee.trim() || 'U',
      assigneeColor,
    };
    const { error } = drawerMode === 'edit' && activeTask
      ? await update(activeTask.id, values)
      : await insert(values);
    setSaving(false);
    if (error) { window.alert(`Could not save task: ${error.message}`); return; }
    closeDrawer();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    const id = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === id);
    setDragOver(null);
    if (!task || task.status === newStatus) return;
    await update(id, { status: newStatus });
  };

  // Toggle checklist item done in-DB from the detail view
  const toggleChecklistItem = async (task: Task, idx: number) => {
    const items = parseCL(task.checklists ?? []);
    items[idx] = { ...items[idx], done: !items[idx].done };
    await update(task.id, { checklists: serializeCL(items) });
    setActiveTask({ ...task, checklists: serializeCL(items) });
  };

  const filteredTasks = useMemo(() => {
    let t = filterByRoleOwnership(tasks, activeRole, user?.fullName || user?.email);
    if (searchQ.trim()) t = t.filter(tk => tk.title.toLowerCase().includes(searchQ.toLowerCase()) || tk.description?.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterPriority !== 'All') t = t.filter(tk => tk.priority === filterPriority);
    return t;
  }, [tasks, activeRole, user, searchQ, filterPriority]);

  const renderColumn = (col: Task['status']) => {
    const cfg = STATUS_CONFIG[col];
    const colTasks = filteredTasks.filter(t => t.status === col);
    const isDragTarget = dragOver === col;

    return (
      <div
        style={{
          background: isDragTarget ? '#F1F5F9' : '#F8FAFC',
          padding: '16px', borderRadius: '16px',
          border: isDragTarget ? '2px dashed #3B82F6' : 'none',
          display: 'flex', flexDirection: 'column', gap: '12px',
          minHeight: '500px', transition: 'all 0.15s ease',
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(col); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => handleDrop(e, col)}
      >
        {/* Column Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {col === 'To Do' && <Square size={16} color={cfg.color} />}
            {col === 'In Progress' && <Loader2 size={16} color={cfg.color} />}
            {col === 'Completed' && <CheckCircle2 size={16} color={cfg.color} />}
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{col}</h3>
          </div>
          <span style={{ background: cfg.header, color: cfg.color, padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
            {colTasks.length}
          </span>
        </div>

        {/* Task Cards */}
        {colTasks.map(task => {
          const pcfg = PRIORITY_CONFIG[task.priority ?? 'Medium'] ?? PRIORITY_CONFIG['Medium'];
          const badge = dueBadge(task.dueDate ?? '', task.status);
          const clItems = parseCL(task.checklists ?? []);
          const clDone = clItems.filter(c => c.done).length;
          const clPct = clItems.length > 0 ? Math.round((clDone / clItems.length) * 100) : -1;

          return (
            <div
              key={task.id}
              draggable
              onDragStart={e => handleDragStart(e, task.id)}
              onClick={() => openDrawer('view', task)}
              style={{
                background: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'grab',
                opacity: task.status === 'Completed' ? 0.75 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {/* Priority badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ background: pcfg.bg, color: pcfg.color, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <pcfg.icon size={11} /> {pcfg.label}
                </span>
                {badge && (
                  <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* Title */}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '8px', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', lineHeight: '1.4' }}>
                {task.title}
              </div>

              {/* Description snippet */}
              {task.description && (
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.description}
                </div>
              )}

              {/* Checklist progress */}
              {clPct >= 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Checklist</span>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{clDone}/{clItems.length}</span>
                  </div>
                  <div style={{ height: '4px', background: '#E5E9F2', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${clPct}%`, background: clPct === 100 ? '#10B981' : '#3B82F6', borderRadius: '100px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* Footer: dates & assignee */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {task.dueDate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                    <Calendar size={11} />
                    {task.dueDate}
                  </div>
                ) : <span />}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: task.assigneeColor ?? '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white', border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  {(task.assignee ?? 'U').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {colTasks.length === 0 && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', textAlign: 'center', color: '#CBD5E1' }}>
            {col === 'To Do' && <Square size={28} />}
            {col === 'In Progress' && <Loader2 size={28} />}
            {col === 'Completed' && <CheckCircle2 size={28} />}
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8' }}>No tasks here</div>
          </div>
        )}

        {/* Add Task button */}
        <div
          onClick={() => openDrawer('create', undefined, col)}
          style={{ padding: '10px', border: '1.5px dashed #CBD5E1', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', color: '#94A3B8', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s ease', marginTop: 'auto' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = cfg.bg; (e.currentTarget as HTMLElement).style.color = cfg.color; (e.currentTarget as HTMLElement).style.borderColor = cfg.color; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; }}
        >
          <Plus size={15} /> Add Task
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboardContent}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Tasks & Kanban</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Manage and track your team&apos;s workflow.</p>
        </div>
        <button className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openDrawer('create', undefined, 'To Do')}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '36px', height: '40px', padding: '0 12px 0 36px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#64748B" />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: 'auto', height: '40px', padding: '0 12px', cursor: 'pointer' }}>
            <option value="All">All Priorities</option>
            <option value="High Priority">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '2px', border: '1px solid #E5E9F2' }}>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
              borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600,
              background: viewMode === 'board' ? 'white' : 'transparent',
              color: viewMode === 'board' ? '#1E3A8A' : '#64748B',
              boxShadow: viewMode === 'board' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={15} /> Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
              borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600,
              background: viewMode === 'list' ? 'white' : 'transparent',
              color: viewMode === 'list' ? '#1E3A8A' : '#64748B',
              boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <List size={15} /> List
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', marginLeft: 'auto' }}>
          {(['To Do', 'In Progress', 'Completed'] as Task['status'][]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = filteredTasks.filter(t => t.status === s).length;
            return (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: cfg.color }}>{count}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View Area: Board vs List */}
      {viewMode === 'board' ? (
        /* Kanban Board */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {renderColumn('To Do')}
          {renderColumn('In Progress')}
          {renderColumn('Completed')}
        </div>
      ) : (
        /* List View */
        <div style={{ background: 'white', border: '1px solid #E5E9F2', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E9F2', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>Task</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Priority</th>
                <th style={{ padding: '14px 16px' }}>Due Date</th>
                <th style={{ padding: '14px 16px' }}>Progress</th>
                <th style={{ padding: '14px 16px' }}>Assignee</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const pcfg = PRIORITY_CONFIG[task.priority ?? 'Medium'] ?? PRIORITY_CONFIG['Medium'];
                const scfg = STATUS_CONFIG[task.status];
                const badge = dueBadge(task.dueDate ?? '', task.status);
                const clItems = parseCL(task.checklists ?? []);
                const clDone = clItems.filter(c => c.done).length;
                const clPct = clItems.length > 0 ? Math.round((clDone / clItems.length) * 100) : -1;

                return (
                  <tr
                    key={task.id}
                    onClick={() => openDrawer('view', task)}
                    style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: scfg.header, color: scfg.color, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: scfg.color }} />
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: pcfg.bg, color: pcfg.color, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <pcfg.icon size={12} /> {pcfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {task.dueDate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{task.dueDate}</span>
                          {badge && (
                            <span style={{ background: badge.bg, color: badge.color, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, width: 'fit-content' }}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      ) : <span style={{ color: '#94A3B8' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px', minWidth: '130px' }}>
                      {clPct >= 0 ? (
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                            {clDone}/{clItems.length} ({clPct}%)
                          </div>
                          <div style={{ height: '4px', background: '#E5E9F2', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${clPct}%`, background: clPct === 100 ? '#10B981' : '#3B82F6', borderRadius: '100px' }} />
                          </div>
                        </div>
                      ) : <span style={{ color: '#94A3B8', fontSize: '12px' }}>No checklist</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: task.assigneeColor ?? '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                          {(task.assignee ?? 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{task.assignee || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDrawer('edit', task)} style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={15} color="#475569" />
                        </button>
                        <button onClick={async () => { if (window.confirm('Delete this task?')) await remove(task.id); }} style={{ background: '#FEE2E2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
                    No tasks found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Drawer */}
      {isDrawerOpen && (
        <div className={styles.rightDrawerOverlay} onClick={closeDrawer} style={{ zIndex: 100 }}>
          <div className={styles.rightDrawer} onClick={e => e.stopPropagation()} style={{ width: '520px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.rightDrawerHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
                {drawerMode === 'create' ? 'New Task' : drawerMode === 'edit' ? 'Edit Task' : 'Task Details'}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {drawerMode === 'view' && activeTask && (
                  <>
                    <button onClick={() => setDrawerMode('edit')} style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit">
                      <Edit2 size={16} color="#475569" />
                    </button>
                    <button onClick={handleDelete} style={{ background: '#FEE2E2', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete">
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </>
                )}
                <button onClick={closeDrawer} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
            </div>

            <div className={styles.rightDrawerContent} style={{ flex: 1, overflowY: 'auto' }}>
              {/* ─── VIEW MODE ─── */}
              {drawerMode === 'view' && activeTask ? (() => {
                const pcfg = PRIORITY_CONFIG[activeTask.priority ?? 'Medium'] ?? PRIORITY_CONFIG['Medium'];
                const scfg = STATUS_CONFIG[activeTask.status];
                const badge = dueBadge(activeTask.dueDate ?? '', activeTask.status);
                const clItems = parseCL(activeTask.checklists ?? []);
                const clDone = clItems.filter(c => c.done).length;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Title & badges */}
                    <div>
                      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', lineHeight: '1.3' }}>{activeTask.title}</h1>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ background: pcfg.bg, color: pcfg.color, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                          {activeTask.priority}
                        </span>
                        <span style={{ background: scfg.header, color: scfg.color, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                          {activeTask.status}
                        </span>
                        {badge && (
                          <span style={{ background: badge.bg, color: badge.color, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {badge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {activeTask.description && (
                      <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', background: '#F8FAFC', padding: '14px', borderRadius: '10px' }}>
                        {activeTask.description}
                      </div>
                    )}

                    {/* Dates & Assignee */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> Start</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{activeTask.startDate || '—'}</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> Due</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{activeTask.dueDate || '—'}</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} /> Assignee</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: activeTask.assigneeColor ?? '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                            {(activeTask.assignee ?? 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{activeTask.assignee || '—'}</span>
                        </div>
                      </div>
                    </div>

              {/* Subtasks */}
                    {(activeTask.subtasks ?? []).length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtasks</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(activeTask.subtasks ?? []).map((st, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '14px', color: '#475569' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                              {st}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklist with live toggle */}
                    {clItems.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checklist</h3>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{clDone}/{clItems.length} done</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '6px', background: '#E5E9F2', borderRadius: '100px', overflow: 'hidden', marginBottom: '12px' }}>
                          <div style={{ height: '100%', width: `${clItems.length > 0 ? Math.round((clDone / clItems.length) * 100) : 0}%`, background: clDone === clItems.length ? '#10B981' : '#3B82F6', borderRadius: '100px', transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {clItems.map((item, i) => (
                            <div
                              key={i}
                              onClick={() => toggleChecklistItem(activeTask, i)}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: item.done ? '#F0FDF4' : '#F8FAFC', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease', border: `1px solid ${item.done ? '#D1FAE5' : '#E5E9F2'}` }}
                            >
                              {item.done
                                ? <CheckSquare size={17} color="#10B981" />
                                : <Square size={17} color="#94A3B8" />
                              }
                              <span style={{ fontSize: '14px', color: item.done ? '#6B7280' : '#0F172A', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dependencies */}
                    {(activeTask.blockingTask || activeTask.waitingTask) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {activeTask.blockingTask && (
                          <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '100px', border: '1px solid #FEE2E2' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: '4px' }}>Blocking</div>
                            <div style={{ fontSize: '13px', color: '#0F172A' }}>{activeTask.blockingTask}</div>
                          </div>
                        )}
                        {activeTask.waitingTask && (
                          <div style={{ background: '#FEFCE8', padding: '12px', borderRadius: '100px', border: '1px solid #FEF08A' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#CA8A04', textTransform: 'uppercase', marginBottom: '4px' }}>Waiting On</div>
                            <div style={{ fontSize: '13px', color: '#0F172A' }}>{activeTask.waitingTask}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })() : (
                /* ─── CREATE / EDIT FORM ─── */
                <form id="taskForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Task Title <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" placeholder="Enter task title" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
                  </div>

                  {/* Status & Priority row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value as Task['status'])} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Priority</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['High Priority', 'Medium', 'Low'] as NonNullable<Task['priority']>[]).map(p => {
                          const c = PRIORITY_CONFIG[p];
                          const active = priority === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              style={{ flex: 1, padding: '8px 0', border: `2px solid ${active ? c.color : '#E5E9F2'}`, borderRadius: '8px', background: active ? c.bg : 'white', color: active ? c.color : '#64748B', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Start Date</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Due Date</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Description</label>
                    <textarea placeholder="Describe the task..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
                  </div>

                  {/* Assignee & Color */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Assignee</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                        <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px', cursor: 'pointer' }}>
                          <option value="">Select Assignee</option>
                          {staff.map(member => (
                            <option key={member.id} value={member.name}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {ASSIGNEE_COLORS.map(c => (
                          <button key={c} type="button" onClick={() => setAssigneeColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: assigneeColor === c ? '3px solid #0F172A' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.1s ease' }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Subtasks</label>
                      <button type="button" onClick={() => setSubtasks([...subtasks, ''])} style={{ background: '#EFF6FF', border: 'none', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    {subtasks.map((st, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: '#F8FAFC', border: '1px solid #E5E9F2', padding: '8px 12px', borderRadius: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                        <input type="text" value={st} onChange={e => { const n = [...subtasks]; n[i] = e.target.value; setSubtasks(n); }} placeholder="Subtask title..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', background: 'transparent' }} />
                        <button type="button" onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: '2px' }}>
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Checklist */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Checklist</label>
                      <button type="button" onClick={() => setChecklistItems([...checklistItems, { text: '', done: false }])} style={{ background: '#EFF6FF', border: 'none', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    {checklistItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: '#F8FAFC', border: '1px solid #E5E9F2', padding: '8px 12px', borderRadius: '8px' }}>
                        <button type="button" onClick={() => { const n = [...checklistItems]; n[i] = { ...n[i], done: !n[i].done }; setChecklistItems(n); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, color: item.done ? '#10B981' : '#94A3B8' }}>
                          {item.done ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                        <input type="text" value={item.text} onChange={e => { const n = [...checklistItems]; n[i] = { ...n[i], text: e.target.value }; setChecklistItems(n); }} placeholder="Checklist item..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', background: 'transparent', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#94A3B8' : '#0F172A' }} />
                        <button type="button" onClick={() => setChecklistItems(checklistItems.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: '2px' }}>
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dependencies */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Blocking Task</label>
                      <input type="text" placeholder="Task this blocks" value={blockingTask} onChange={e => setBlockingTask(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>Waiting On</label>
                      <input type="text" placeholder="Task to wait for" value={waitingTask} onChange={e => setWaitingTask(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {drawerMode !== 'view' && (
              <div className={styles.rightDrawerFooter} style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeDrawer} style={{ padding: '10px 24px', borderRadius: '10px', background: 'white', border: '1.5px solid #E5E9F2', cursor: 'pointer', fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>
                  Cancel
                </button>
                <button type="submit" form="taskForm" disabled={saving} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 24px', borderRadius: '10px', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Saving…' : drawerMode === 'edit' ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  LogOut, Plus, Search, Check, Pencil, Trash2,
  CheckCircle2, Clock, Calendar, X, Loader2,
  LayoutList, AlertCircle,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high';
type FilterStatus = 'all' | 'pending' | 'completed' | 'due-today';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; badge: string }> = {
  low:    { label: 'Low',  dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  medium: { label: 'Med',  dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  high:   { label: 'High', dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'due-today', label: 'Due Today' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function dueBadge(dueDate: string | null): { text: string; cls: string } | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return null;
  const { start, end } = todayRange();
  const dayAfter = new Date(end); dayAfter.setDate(dayAfter.getDate() + 1);
  if (d < start)  return { text: `Overdue · ${format(d, 'MMM d')}`, cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' };
  if (d < end)    return { text: 'Due today',                        cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' };
  if (d < dayAfter) return { text: 'Tomorrow',                       cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
  return { text: format(d, 'MMM d'),                                 cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
}

function isValidTask(obj: unknown): obj is Task {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.title === 'string';
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

interface CardProps {
  task: Task;
  editingId: string | null;
  editValue: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (t: Task) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditChange: (v: string) => void;
}

function TaskCard({
  task, editingId, editValue,
  onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit, onEditChange,
}: CardProps) {
  const isEditing = editingId === task.id;
  const p   = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const due = dueBadge(task.dueDate);

  return (
    <div className={`group flex items-start gap-3 bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/30 ${
      task.completed
        ? 'border-gray-100 dark:border-gray-800/40 opacity-60'
        : 'border-gray-200 dark:border-gray-800'
    }`}>

      {/* Priority dot */}
      <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${p.dot} ${task.completed ? 'opacity-30' : ''}`} />

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
        }`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter')  onSaveEdit(task.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
            onBlur={() => onSaveEdit(task.id)}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none border-b border-blue-400 pb-0.5"
          />
        ) : (
          <p className={`text-sm font-medium leading-relaxed break-words ${
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-600'
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            {task.title}
          </p>
        )}

        {!isEditing && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${p.badge}`}>
              {p.label}
            </span>
            {due && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${due.cls}`}>
                <Calendar size={10} />
                {due.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions: always visible on mobile, hover-reveal on sm+ */}
      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <button
              onClick={() => onSaveEdit(task.id)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors"
              aria-label="Save edit"
            >
              <Check size={15} />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
              aria-label="Cancel edit"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onStartEdit(task)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="Edit task"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2" aria-label="Loading tasks">
      {[80, 55, 90, 65].map((w, i) => (
        <div
          key={i}
          className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 animate-pulse"
        >
          <div className="mt-2 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded-full bg-gray-200 dark:bg-gray-700" style={{ width: `${w}%` }} />
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [newTask,     setNewTask]     = useState('');
  const [newDue,      setNewDue]      = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [filter,      setFilter]      = useState<FilterStatus>('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [adding,      setAdding]      = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editValue,   setEditValue]   = useState('');
  const router = useRouter();

  useEffect(() => { fetchTasks(); }, []);

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      setTasks(Array.isArray(data) ? (data as Task[]) : []);
    } catch {
      toast.error('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAdding(true);

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic: Task = {
      id: tempId,
      title: newTask.trim(),
      completed: false,
      dueDate: newDue || null,
      priority: newPriority,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [optimistic, ...prev]);
    setNewTask('');
    setNewDue('');
    setNewPriority('medium');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: optimistic.title,
          dueDate: optimistic.dueDate,
          priority: optimistic.priority,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: unknown = await res.json();
      if (!isValidTask(saved)) throw new Error('Invalid response');
      setTasks(prev => prev.map(t => t.id === tempId ? (saved as Task) : t));
    } catch {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      toast.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  }

  async function toggleComplete(id: string) {
    const backup = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: unknown = await res.json();
      if (!isValidTask(updated)) throw new Error('Invalid response');
      setTasks(prev => prev.map(t => t.id === id ? (updated as Task) : t));
    } catch {
      setTasks(backup);
      toast.error('Update failed');
    }
  }

  async function deleteTask(id: string) {
    const backup = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setTasks(backup);
      toast.error('Delete failed');
    }
  }

  async function saveEdit(id: string) {
    if (!editValue.trim()) { setEditingId(null); return; }
    const backup = [...tasks];
    const trimmed = editValue.trim();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: trimmed } : t));
    setEditingId(null);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: unknown = await res.json();
      if (!isValidTask(updated)) throw new Error('Invalid response');
      setTasks(prev => prev.map(t => t.id === id ? (updated as Task) : t));
    } catch {
      setTasks(backup);
      toast.error('Update failed');
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const { start, end } = todayRange();
    return {
      total:     tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending:   tasks.filter(t => !t.completed).length,
      dueToday:  tasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d >= start && d < end;
      }).length,
    };
  }, [tasks]);

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const { start, end } = todayRange();
    let result = tasks;

    if (filter === 'pending')   result = result.filter(t => !t.completed);
    if (filter === 'completed') result = result.filter(t => t.completed);
    if (filter === 'due-today') result = result.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return !isNaN(d.getTime()) && d >= start && d < end;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, filter, search]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutList size={15} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">TaskFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: 'Total',     value: stats.total,     icon: <LayoutList size={17} />,   bg: 'bg-blue-50 dark:bg-blue-900/20',       fg: 'text-blue-600 dark:text-blue-400' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={17} />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', fg: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pending',   value: stats.pending,   icon: <Clock size={17} />,        bg: 'bg-amber-50 dark:bg-amber-900/20',     fg: 'text-amber-600 dark:text-amber-400' },
            { label: 'Due Today', value: stats.dueToday,  icon: <AlertCircle size={17} />,  bg: 'bg-red-50 dark:bg-red-900/20',         fg: 'text-red-600 dark:text-red-400' },
          ] as const).map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
              <div className={`flex items-center gap-1.5 mb-2 ${s.fg}`}>
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.fg}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add task */}
        <form
          onSubmit={addTask}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 shadow-sm"
        >
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none text-sm font-medium"
          />
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as Priority)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={newDue}
              onChange={e => setNewDue(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none cursor-pointer dark:[color-scheme:dark]"
            />
            <button
              type="submit"
              disabled={adding || !newTask.trim()}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Task
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {f.label}
              {f.key === 'due-today' && stats.dueToday > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === f.key
                    ? 'bg-white/25 text-white'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {stats.dueToday}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <CheckCircle2 size={26} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {search
                ? 'No tasks match your search'
                : filter !== 'all'
                ? `No ${filter} tasks`
                : 'No tasks yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {!search && filter === 'all'
                ? 'Add your first task above to get started'
                : 'Try a different filter or search term'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                editingId={editingId}
                editValue={editValue}
                onToggle={toggleComplete}
                onDelete={deleteTask}
                onStartEdit={t => { setEditingId(t.id); setEditValue(t.title); }}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                onEditChange={setEditValue}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

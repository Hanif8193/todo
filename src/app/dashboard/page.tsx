'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, LogOut } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
}

type FilterStatus = 'all' | 'active' | 'completed';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setAdding(true);

    const tempTask: Task = {
      id: Math.random().toString(),
      title: newTask,
      completed: false,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [tempTask, ...prev]);
    setNewTask('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempTask),
      });

      const saved = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === tempTask.id ? saved : t))
      );
    } catch {
      toast.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const toggleComplete = async (id: string) => {
    const backup = [...tasks];

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: 'PATCH',
      });

      const updated = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch {
      setTasks(backup);
      toast.error('Update failed');
    }
  };

  const deleteTask = async (id: string) => {
    const backup = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch {
      setTasks(backup);
      toast.error('Delete failed');
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;

    const backup = [...tasks];

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title: editValue } : t
      )
    );

    setEditingId(null);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editValue }),
      });

      const updated = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch {
      setTasks(backup);
      toast.error('Update failed');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });
  }, [tasks, filter]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">

      <div className="w-full max-w-2xl">

        {/* HEADER */}
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Task Dashboard</h1>

          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* ADD TASK */}
        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <input
            className="border p-2 flex-1 rounded"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task"
          />
          <button className="bg-blue-600 text-white px-4 rounded">
            {adding ? <Loader2 className="animate-spin" /> : 'Add'}
          </button>
        </form>

        {/* FILTER */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 border rounded ${
                filter === f ? 'bg-black text-white' : ''
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TASK LIST */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center border p-3 bg-white rounded"
            >

              <div className="flex items-center gap-2">

                <button onClick={() => toggleComplete(task.id)}>
                  {task.completed ? '✔' : '○'}
                </button>

                {editingId === task.id ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="border-b outline-none px-1"
                  />
                ) : (
                  <span className={task.completed ? 'line-through' : ''}>
                    {task.title}
                  </span>
                )}

              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  className="px-2 hover:bg-blue-100 rounded"
                >
                  ✏️
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-2 hover:bg-red-100 rounded"
                >
                  🗑
                </button>

              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

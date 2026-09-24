'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, CheckCircle, Circle, Calendar, Edit3, X } from 'lucide-react';
import confetti from 'canvas-confetti';

type Priority = 'Low' | 'Medium' | 'High';
type Category = 'Pribadi' | 'Pekerjaan' | 'Side Hustle';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Todo {
  id: string;
  title: string;
  priority: Priority;
  category: Category;
  deadline?: string | null;
  subtasks: Subtask[];
  completed: boolean;
}

const formatDateID = (dateString?: string | null) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}-${month}-${year}`;
};

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');
  const [newCategory, setNewCategory] = useState<Category>('Pribadi');
  const [newDeadline, setNewDeadline] = useState('');
  
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Medium');
  const [editCategory, setEditCategory] = useState<Category>('Pribadi');
  const [editDeadline, setEditDeadline] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (!error && data) setTodos(data);
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedSubtasks: Subtask[] = subtasks.map((st, index) => ({
      id: `${Date.now()}-${index}`,
      title: st,
      completed: false,
    }));

    const payload: any = {
      title: newTitle,
      priority: newPriority,
      category: newCategory,
      subtasks: formattedSubtasks,
      completed: false
    };

    if (newDeadline) {
      payload.deadline = newDeadline;
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([payload])
      .select();

    if (!error && data) {
      setTodos([data[0], ...todos]);
      setNewTitle('');
      setSubtasks([]);
      setSubtaskInput('');
      setNewDeadline('');
    } else if (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('todos').update({ completed: newStatus }).eq('id', id);
    if (!error) {
      setTodos(todos.map(t => (t.id === id ? { ...t, completed: newStatus } : t)));
      if (newStatus) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    }
  };

  const toggleSubtask = async (todoId: string, subtaskId: string) => {
    const targetTodo = todos.find(t => t.id === todoId);
    if (!targetTodo) return;

    const updatedSubtasks = targetTodo.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const { error } = await supabase.from('todos').update({ subtasks: updatedSubtasks }).eq('id', todoId);
    if (!error) {
      setTodos(todos.map(t => (t.id === todoId ? { ...t, subtasks: updatedSubtasks } : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTodos(todos.filter(t => t.id !== id));
    }
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditCategory(todo.category);
    setEditDeadline(todo.deadline || '');
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    const updatePayload: any = {
      title: editTitle,
      priority: editPriority,
      category: editCategory,
    };

    if (editDeadline) {
      updatePayload.deadline = editDeadline;
    } else {
      updatePayload.deadline = null;
    }

    const { error } = await supabase
      .from('todos')
      .update(updatePayload)
      .eq('id', editingTodo.id);

    if (!error) {
      setTodos(todos.map(t => t.id === editingTodo.id ? {
        ...t,
        title: editTitle,
        priority: editPriority,
        category: editCategory,
        deadline: editDeadline || null,
      } : t));
      setEditingTodo(null);
    }
  };

  const addSubtaskInputToList = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, subtaskInput.trim()]);
    setSubtaskInput('');
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const activeTodos = filteredTodos.filter(t => !t.completed);
  const completedTodos = filteredTodos.filter(t => t.completed);

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-700/50 space-y-6 relative text-slate-100">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold text-white">To-Do Manager & Subtasks</h2>
        <div className="flex w-full sm:w-auto bg-slate-900/60 p-1 rounded-xl text-xs sm:text-sm border border-slate-700/50">
          <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Semua</button>
          <button onClick={() => setFilter('active')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition ${filter === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Aktif</button>
          <button onClick={() => setFilter('completed')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition ${filter === 'completed' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Selesai</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition ${categoryFilter === 'all' ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-900/60 text-slate-400 border border-slate-800'}`}>Semua Kategori</button>
        <button onClick={() => setCategoryFilter('Pekerjaan')} className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition ${categoryFilter === 'Pekerjaan' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 border border-slate-800'}`}>🏢 Pekerjaan</button>
        <button onClick={() => setCategoryFilter('Side Hustle')} className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition ${categoryFilter === 'Side Hustle' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 border border-slate-800'}`}>🚀 Side Hustle</button>
        <button onClick={() => setCategoryFilter('Pribadi')} className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition ${categoryFilter === 'Pribadi' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 border border-slate-800'}`}>👤 Pribadi</button>
      </div>

      <form onSubmit={addTodo} className="space-y-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Judul Tugas</label>
          <input
            type="text"
            placeholder="Apa yang ingin dikerjakan?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Kategori</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Category)}
              className="w-full px-3 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="Pribadi">Pribadi</option>
              <option value="Pekerjaan">Pekerjaan</option>
              <option value="Side Hustle">Side Hustle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Prioritas</label>
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as Priority)}
              className="w-full px-3 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Deadline</label>
            <input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 h-[38px] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/50 space-y-2">
          <label className="block text-xs font-bold text-slate-400">Sub-tasks (Opsional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tambah subtask..."
              value={subtaskInput}
              onChange={e => setSubtaskInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={addSubtaskInputToList}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              + Tambah Subtask
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {subtasks.map((st, idx) => (
                <span key={idx} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  • {st}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-md shadow-indigo-600/30 mt-2"
        >
          <Plus size={18} /> Simpan Tugas Baru
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tugas Aktif</h3>
        {activeTodos.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4 text-center">Belum ada tugas aktif saat ini.</p>
        ) : (
          activeTodos.map(todo => (
            <div key={todo.id} className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3 hover:border-slate-600 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="text-slate-400 hover:text-indigo-400 transition mt-1">
                    <Circle size={22} />
                  </button>
                  <div className="space-y-1.5 flex-1">
                    <span className="font-semibold text-white text-sm block leading-snug">{todo.title}</span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        todo.category === 'Pekerjaan' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        todo.category === 'Side Hustle' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      }`}>
                        {todo.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        todo.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        todo.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {todo.priority}
                      </span>
                      {todo.deadline && (
                        <span className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-medium border border-slate-700">
                          <Calendar size={12} /> {formatDateID(todo.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(todo)} className="text-slate-400 hover:text-indigo-400 p-1.5 transition" title="Edit Tugas">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => deleteTodo(todo.id)} className="text-slate-400 hover:text-rose-400 p-1.5 transition" title="Hapus Tugas">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {todo.subtasks && todo.subtasks.length > 0 && (
                <div className="ml-8 pl-3 border-l-2 border-slate-700/60 space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Sub-tasks:</span>
                  {todo.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 cursor-pointer py-0.5" onClick={() => toggleSubtask(todo.id, st.id)}>
                      {st.completed ? <CheckCircle size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-slate-500 shrink-0" />}
                      <span className={`text-xs ${st.completed ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}`}>{st.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {completedTodos.length > 0 && filter !== 'active' && (
        <div className="space-y-3 pt-4 border-t border-slate-700/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</h3>
          {completedTodos.map(todo => (
            <div key={todo.id} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 opacity-75 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTodo(todo.id, todo.completed)} className="text-emerald-400 transition">
                  <CheckCircle size={22} />
                </button>
                <span className="font-medium text-slate-500 text-sm line-through">{todo.title}</span>
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="text-slate-500 hover:text-rose-400 p-1.5 transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editingTodo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Tugas</h3>
              <button onClick={() => setEditingTodo(null)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTodo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Judul Tugas</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Kategori</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 focus:outline-none"
                  >
                    <option value="Pribadi">Pribadi</option>
                    <option value="Pekerjaan">Pekerjaan</option>
                    <option value="Side Hustle">Side Hustle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Prioritas</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Deadline</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-xs font-medium text-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
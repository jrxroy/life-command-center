'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Flame, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: string;
  completions: string[];
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Pribadi');
  const [newFrequency, setNewFrequency] = useState('Setiap Hari (Daily)');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching habits:', error);
    } else {
      setHabits(data || []);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.from('habits').insert([
      {
        title: newTitle,
        category: newCategory,
        frequency: newFrequency,
        completions: []
      }
    ]).select();

    if (error) {
      alert('Gagal menambah habit: ' + error.message);
    } else if (data) {
      setHabits([data[0], ...habits]);
      setNewTitle('');
    }
    setLoading(false);
  };

  const toggleCompletion = async (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    let updatedCompletions = [...(habit.completions || [])];
    if (updatedCompletions.includes(dateStr)) {
      updatedCompletions = updatedCompletions.filter((d) => d !== dateStr);
    } else {
      updatedCompletions.push(dateStr);
    }

    const { error } = await supabase
      .from('habits')
      .update({ completions: updatedCompletions })
      .eq('id', habitId);

    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      setHabits(habits.map((h) => (h.id === habitId ? { ...h, completions: updatedCompletions } : h)));
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setHabits(habits.filter((h) => h.id !== habitId));
    }
  };

  // Generate 7 hari terakhir untuk tampilan kalender/checklist harian
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateString: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dayNumber: d.getDate()
      });
    }
    return days;
  };

  const weekDays = getLast7Days();

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Flame className="text-orange-500" /> Habit Tracker
        </h2>
      </div>

      {/* Form Tambah Habit */}
      <form onSubmit={addHabit} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Nama Habit</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Contoh: Olahraga 15 Menit..."
            className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Kategori</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
            >
              <option value="Pribadi">Pribadi</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pekerjaan">Pekerjaan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Frekuensi</label>
            <select
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
            >
              <option value="Setiap Hari (Daily)">Setiap Hari (Daily)</option>
              <option value="Mingguan">Mingguan</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus size={18} /> {loading ? 'Menyimpan...' : 'Tambah Habit Baru'}
        </button>
      </form>

      {/* Daftar Habit & Tampilan Kalender Mingguan */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Daftar Habit & Kalender 7 Hari Terakhir</h3>
        {habits.length === 0 ? (
          <p className="text-center text-slate-400 py-8 italic">Belum ada habit yang ditambahkan.</p>
        ) : (
          habits.map((habit) => {
            const completions = habit.completions || [];
            const streak = completions.length;

            return (
              <div key={habit.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-base">{habit.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{habit.category}</span>
                      <span className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                        <Flame size={12} /> {streak} Hari Selesai
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Grid Kalender / Checklist 7 Hari */}
                <div className="grid grid-cols-7 gap-1 pt-2 border-t border-slate-100">
                  {weekDays.map((day) => {
                    const isCompleted = completions.includes(day.dateString);
                    return (
                      <button
                        key={day.dateString}
                        type="button"
                        onClick={() => toggleCompletion(habit.id, day.dateString)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
                        <span className="text-xs font-bold my-0.5">{day.dayNumber}</span>
                        {isCompleted ? <CheckCircle2 size={14} className="mt-0.5" /> : <Circle size={14} className="mt-0.5 text-slate-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
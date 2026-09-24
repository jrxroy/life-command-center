'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Plus, Flame, Target, BookOpen, Gift, ShieldCheck, Trash2, CheckCircle2, Circle } from 'lucide-react';
import confetti from 'canvas-confetti';

type Category = 'Pribadi' | 'Pekerjaan' | 'Side Hustle';
type Frequency = 'Setiap Hari (Daily)' | 'Mingguan (Weekly)';

interface HabitCompletion {
  id: string;
  date: string; // Format YYYY-MM-DD
}

interface Habit {
  id: string;
  title: string;
  category: Category;
  frequency: Frequency;
  completions: HabitCompletion[];
  created_at: string;
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Pribadi');
  const [newFrequency, setNewFrequency] = useState<Frequency>('Setiap Hari (Daily)');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const parsedHabits = data.map(habit => ({
        ...habit,
        completions: Array.isArray(habit.completions) ? habit.completions : []
      }));
      setHabits(parsedHabits);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsLoading(true);

    const newHabit = {
      title: newTitle,
      category: newCategory,
      frequency: newFrequency,
      completions: [],
    };

    const { data, error } = await supabase
      .from('habits')
      .insert([newHabit])
      .select();

    setIsLoading(false);

    if (!error && data) {
      setHabits((prev: any) => [data[0], ...prev]);
      setNewTitle('');
    } else {
      console.error('Error adding habit:', error);
      alert('Gagal menambah habit.');
    }
  };

  const toggleCompletion = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let updatedCompletions: HabitCompletion[];
    const completionIndex = habit.completions.findIndex(c => c.date === today);

    if (completionIndex > -1) {
      updatedCompletions = habit.completions.filter(c => c.date !== today);
    } else {
      updatedCompletions = [...habit.completions, { id: `${Date.now()}`, date: today }];
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.9 } });
    }

    const { error } = await supabase
      .from('habits')
      .update({ completions: updatedCompletions })
      .eq('id', habitId);

    if (!error) {
      setHabits(habits.map(h => (h.id === habitId ? { ...h, completions: updatedCompletions } : h)));
    }
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (!error) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  const getStreak = (completions: HabitCompletion[]) => {
    if (completions.length === 0) return 0;
    const sortedDates = completions.map(c => new Date(c.date)).sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 3600 * 24));
      if (diffDays === i) {
        streak++;
      } else if (diffDays > i) {
        break;
      }
    }
    return streak;
  };

  const isCompletedToday = (completions: HabitCompletion[]) => {
    const today = new Date().toISOString().split('T')[0];
    return completions.some(c => c.date === today);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6 relative text-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Habit Tracker</h2>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200">
          <ShieldCheck size={14} />
          <span>Bangun Konsistensi</span>
        </div>
      </div>

      <form onSubmit={addHabit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Nama Habit</label>
          <input
            type="text"
            placeholder="Misal: Olahraga 30 Menit, Membaca Buku..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Kategori</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Category)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              <option value="Pribadi">Pribadi</option>
              <option value="Pekerjaan">Pekerjaan</option>
              <option value="Side Hustle">Side Hustle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Parameter / Frekuensi</label>
            <select
              value={newFrequency}
              onChange={e => setNewFrequency(e.target.value as Frequency)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              <option value="Setiap Hari (Daily)">Setiap Hari (Daily)</option>
              <option value="Mingguan (Weekly)">Mingguan (Weekly)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-md shadow-emerald-600/20 mt-2"
        >
          <Plus size={18} /> {isLoading ? 'Menyimpan...' : 'Tambah Habit Baru'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Habit Hari Ini</h3>
        {habits.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada habit yang dibuat. Yuk, buat habit pertamamu!</p>
        ) : (
          habits.map(habit => {
            const completed = isCompletedToday(habit.completions);
            const streak = getStreak(habit.completions);
            return (
              <div key={habit.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 transition hover:border-slate-300">
                <div className="flex items-center gap-3.5 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleCompletion(habit.id)}
                    className={`p-2 rounded-xl transition ${
                      completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    {completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="space-y-1">
                    <span className={`font-semibold text-sm block ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {habit.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {habit.category}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Flame size={12} /> {streak} Hari Streak
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteHabit(habit.id)}
                  className="text-slate-400 hover:text-rose-600 p-2 transition"
                  title="Hapus Habit"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
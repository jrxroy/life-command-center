'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Flame, Plus, Trash2, Calendar as CalendarIcon, Check } from 'lucide-react';

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

  // Generate daftar tanggal untuk 90 hari ke belakang (bisa diperluas hingga setahun penuh)
  const getYearGridDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push({
        dateString: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      });
    }
    return days;
  };

  const calendarDays = getYearGridDays();

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Flame className="text-orange-500" /> Habit Tracker & Calendar View
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
            placeholder="Contoh: Membaca Buku, Coding 1 Jam..."
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

      {/* Daftar Habit dengan Kalender Heatmap Panjang */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <CalendarIcon size={16} /> Riwayat Kalender Habit
        </h3>
        {habits.length === 0 ? (
          <p className="text-center text-slate-400 py-8 italic">Belum ada habit yang ditambahkan.</p>
        ) : (
          habits.map((habit) => {
            const completions = habit.completions || [];
            const streak = completions.length;

            return (
              <div key={habit.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{habit.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-600 font-medium">{habit.category}</span>
                      <span className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                        <Flame size={12} /> {streak} Total Selesai
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Grid Kalender Panjang (Heatmap / Riwayat Kebelakang) */}
                <div className="overflow-x-auto pb-2">
                  <p className="text-xs text-slate-400 mb-2">Klik kotak tanggal untuk menandai status selesai:</p>
                  <div className="flex gap-1.5 min-w-max">
                    {calendarDays.map((day) => {
                      const isCompleted = completions.includes(day.dateString);
                      return (
                        <button
                          key={day.dateString}
                          type="button"
                          title={`${day.label}: ${isCompleted ? 'Selesai' : 'Belum'}`}
                          onClick={() => toggleCompletion(habit.id, day.dateString)}
                          className={`w-7 h-9 rounded flex flex-col items-center justify-center text-[10px] transition cursor-pointer border ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {isCompleted ? <Check size={12} /> : <span>{day.label.split(' ')[0]}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
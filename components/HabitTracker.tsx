'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Flame, Plus, Trash2, Calendar as CalendarIcon, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // State untuk Modal Kalender
  const [activeHabitForCalendar, setActiveHabitForCalendar] = useState<Habit | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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
      // Update juga object habit yang sedang dibuka di modal agar UI sinkron
      if (activeHabitForCalendar && activeHabitForCalendar.id === habitId) {
        setActiveHabitForCalendar({ ...activeHabitForCalendar, completions: updatedCompletions });
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setHabits(habits.filter((h) => h.id !== habitId));
      if (activeHabitForCalendar?.id === habitId) {
        setActiveHabitForCalendar(null);
      }
    }
  };

  // Helper untuk navigasi bulan di modal kalender
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate hari dalam satu bulan tertentu untuk ditampilkan di modal grid
  const getDaysInMonth = (year: number, month: number) => {
    const days = [];
    const date = new Date(year, month, 1);
    const firstDayIndex = date.getDay(); // Hari pertama di bulan (0 = Minggu)
    
    // Padding kosong untuk hari sebelum tanggal 1 di minggu tersebut
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Masukkan tanggal-tanggal dalam bulan tersebut
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const yearDays = activeHabitForCalendar 
    ? getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) 
    : [];

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xl space-y-6 relative">
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
            placeholder="Contoh: Membaca Buku, Olahraga..."
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

      {/* Daftar Habit Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Daftar Habit</h3>
        {habits.length === 0 ? (
          <p className="text-center text-slate-400 py-8 italic">Belum ada habit yang ditambahkan.</p>
        ) : (
          habits.map((habit) => {
            const streak = (habit.completions || []).length;
            const todayStr = new Date().toISOString().split('T')[0];
            const isDoneToday = (habit.completions || []).includes(todayStr);

            return (
              <div key={habit.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">{habit.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{habit.category}</span>
                    <span className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                      <Flame size={12} /> {streak} Total Selesai
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tombol Checklist Hari Ini */}
                  <button
                    type="button"
                    onClick={() => toggleCompletion(habit.id, todayStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isDoneToday 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Check size={14} /> {isDoneToday ? 'Selesai Hari Ini' : 'Ceklis Hari Ini'}
                  </button>

                  {/* Tombol Buka Kalender Historis */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHabitForCalendar(habit);
                      setCurrentDate(new Date());
                    }}
                    title="Buka Kalender Historis"
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  >
                    <CalendarIcon size={18} />
                  </button>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    title="Hapus Habit"
                    className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-400 transition cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL KALENDER BULANAN */}
      {activeHabitForCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{activeHabitForCalendar.title}</h3>
                <p className="text-xs text-slate-500">Pilih tanggal untuk melihat atau menandai riwayat</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHabitForCalendar(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigasi Bulan & Tahun */}
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-white border border-slate-200 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-sm text-slate-700">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-white border border-slate-200 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Grid Hari dalam Minggu */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400">
              <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1.5">
              {yearDays.map((dateObj, idx) => {
                if (!dateObj) {
                  return <div key={`empty-${idx}`} />;
                }
                const dateStr = dateObj.toISOString().split('T')[0];
                const isCompleted = (activeHabitForCalendar.completions || []).includes(dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleCompletion(activeHabitForCalendar.id, dateStr)}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer border ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                        : isToday
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{dateObj.getDate()}</span>
                    {isCompleted && <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t text-center">
              <button
                type="button"
                onClick={() => setActiveHabitForCalendar(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
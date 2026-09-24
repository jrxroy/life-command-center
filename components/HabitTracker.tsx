'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Habit, HabitLog, FrequencyType } from '../types/habit';
import { Plus, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Pribadi');
  const [freqType, setFreqType] = useState<FrequencyType>('daily');

  const [activeHabitForCalendar, setActiveHabitForCalendar] = useState<Habit | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const todayStr = getLocalDateString(new Date());

  useEffect(() => {
    fetchHabitsAndLogs();
  }, []);

  const fetchHabitsAndLogs = async () => {
    const { data: habitData } = await supabase.from('habits').select('*').order('created_at', { ascending: false });
    const { data: logData } = await supabase.from('habit_logs').select('*');
    
    if (habitData) setHabits(habitData);
    if (logData) setLogs(logData);
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle,
      category: newCategory,
      frequency_type: freqType,
      frequency_target: {}
    };

    const { data, error } = await supabase.from('habits').insert([payload]).select();
    if (error) {
      console.error('Error adding habit:', error.message);
      alert('Gagal menambah habit: ' + error.message);
      return;
    }

    if (data) {
      setHabits([data[0], ...habits]);
      setNewTitle('');
      setFreqType('daily');
    }
  };

  const toggleLogToday = async (habitId: string) => {
    const existingLog = logs.find(l => l.habit_id === habitId && l.date === todayStr);
    const newStatus = existingLog ? !existingLog.completed : true;

    if (existingLog) {
      const { error } = await supabase
        .from('habit_logs')
        .update({ completed: newStatus })
        .eq('id', existingLog.id);

      if (!error) {
        setLogs(logs.map(l => l.id === existingLog.id ? { ...l, completed: newStatus } : l));
        if (newStatus) confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      }
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{ habit_id: habitId, date: todayStr, completed: true }])
        .select();

      if (!error && data) {
        setLogs([...logs, data[0]]);
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      }
    }
  };

  const isCompletedToday = (habitId: string) => {
    return logs.some(l => l.habit_id === habitId && l.date === todayStr && l.completed);
  };

  const renderCalendarDays = (habit: Habit) => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const daysArray = [];
    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const logEntry = logs.find(l => l.habit_id === habit.id && l.date === formattedDate);
      const isDone = logEntry?.completed;
      const isToday = formattedDate === todayStr;

      daysArray.push(
        <div
          key={formattedDate}
          className={`h-9 w-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition ${
            isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
        >
          <span>{day}</span>
        </div>
      );
    }
    return daysArray;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Habit Tracker</h2>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          🔥 Bangun Konsistensi
        </span>
      </div>

      <form onSubmit={addHabit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nama Habit</label>
          <input
            type="text"
            placeholder="Contoh: Olahraga 30 Menit, Membaca Buku..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              <option value="Pribadi">Pribadi</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Karier / Belajar">Karier / Belajar</option>
              <option value="Side Hustle">Side Hustle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Parameter / Frekuensi</label>
            <select
              value={freqType}
              onChange={e => setFreqType(e.target.value as FrequencyType)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              <option value="daily">Setiap Hari (Daily)</option>
              <option value="specific_days">Hari Tertentu dalam Seminggu</option>
              <option value="weekly_count">Target X Kali Seminggu</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm mt-2"
        >
          <Plus size={18} /> Tambah Habit Baru
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Habit Hari Ini</h3>
        {habits.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada habit yang dibuat. Yuk, buat habit pertamamu!</p>
        ) : (
          habits.map(habit => {
            const doneToday = isCompletedToday(habit.id);
            const freqLabel = habit.frequency_type ? habit.frequency_type.replace('_', ' ') : 'daily';
            return (
              <div key={habit.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleLogToday(habit.id)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                      doneToday ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                  <div className="space-y-1">
                    <span className={`font-semibold text-sm block ${doneToday ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {habit.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-medium">{habit.category}</span>
                      <span className="text-slate-400 capitalize">• {freqLabel}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveHabitForCalendar(habit)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition shrink-0"
                  title="Lihat Kalender Habit"
                >
                  <CalendarIcon size={14} /> Kalender
                </button>
              </div>
            );
          })
        )}
      </div>

      {activeHabitForCalendar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{activeHabitForCalendar.title}</h3>
                <span className="text-xs text-slate-400">Riwayat Kalender Bulanan</span>
              </div>
              <button onClick={() => setActiveHabitForCalendar(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <button
                onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-bold text-slate-700">
                {currentMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1">
              <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 justify-items-center">
              {renderCalendarDays(activeHabitForCalendar)}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-emerald-500 rounded-sm"></div> <span>Dikerjakan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-slate-100 border border-slate-200 rounded-sm"></div> <span>Terlewat / Kosong</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
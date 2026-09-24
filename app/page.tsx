'use client';

import { useState } from 'react';
import { TodoList } from '@/components/TodoList';
import { HabitTracker } from '@/components/HabitTracker';
import { Workplan } from '@/components/Workplan';
import { Journaling } from '@/components/Journaling';
import { Wishlist } from '@/components/Wishlist';
import { CheckSquare, Flame, Target, BookOpen, Gift, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'todo' | 'habit' | 'workplan' | 'journal' | 'wishlist'>('todo');

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Utama dengan Tema Modern & Credit */}
        <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Roy’s Life & Command Center</h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400 font-medium tracking-wide">
              <ShieldCheck size={14} />
              <span>Crafted by Roy Hamdani Simarmata</span>
            </div>
          </div>
        </div>

        {/* Navigasi Tab */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-800/80 backdrop-blur-xl p-2 rounded-2xl shadow-lg border border-slate-700/50">
          <button
            type="button"
            onClick={() => setActiveTab('todo')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'todo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <CheckSquare size={16} />
            <span>To-Do</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('habit')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'habit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <Flame size={16} />
            <span>Habit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workplan')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'workplan'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <Target size={16} />
            <span>Workplan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <BookOpen size={16} />
            <span>Journal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition col-span-2 sm:col-span-1 cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <Gift size={16} />
            <span>Wishlist</span>
          </button>
        </div>

        {/* Konten Tab Aktif */}
        <div className="transition-all">
          {activeTab === 'todo' && <TodoList />}
          {activeTab === 'habit' && <HabitTracker />}
          {activeTab === 'workplan' && <Workplan />}
          {activeTab === 'journal' && <Journaling />}
          {activeTab === 'wishlist' && <Wishlist />}
        </div>

      </div>
    </main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface WorkplanItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

export function Workplan() {
  const [workplans, setWorkplans] = useState<WorkplanItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Side Hustle');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchWorkplans();
  }, []);

  const fetchWorkplans = async () => {
    const { data, error } = await supabase
      .from('workplans')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setWorkplans(data);
  };

  const addWorkplan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from('workplans')
      .insert([{
        title,
        category,
        description,
        status: 'Belum Dimulai'
      }])
      .select();

    if (!error && data) {
      setWorkplans([data[0], ...workplans]);
      setTitle('');
      setDescription('');
    } else if (error) {
      alert('Gagal menambah workplan: ' + error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    let nextStatus = 'Belum Dimulai';
    if (currentStatus === 'Belum Dimulai') nextStatus = 'Sedang Berjalan';
    else if (currentStatus === 'Sedang Berjalan') nextStatus = 'Selesai';
    else if (currentStatus === 'Selesai') nextStatus = 'Belum Dimulai';

    const { error } = await supabase
      .from('workplans')
      .update({ status: nextStatus })
      .eq('id', id);

    if (!error) {
      setWorkplans(workplans.map(w => w.id === id ? { ...w, status: nextStatus } : w));
    }
  };

  const deleteWorkplan = async (id: string) => {
    const { error } = await supabase.from('workplans').delete().eq('id', id);
    if (!error) {
      setWorkplans(workplans.filter(w => w.id !== id));
    }
  };

  return (
    <div className="bg-white text-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Rencana Kerja & Strategi</h2>
        <span className="text-[11px] sm:text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          🚀 Action Plan
        </span>
      </div>

      {/* Form Tambah Workplan */}
      <form onSubmit={addWorkplan} className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Judul Rencana Kerja</label>
          <input
            type="text"
            placeholder="Contoh: Optimasi Iklan Meta Ads Shopee Affiliate..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm font-medium"
            >
              <option value="Side Hustle">Side Hustle</option>
              <option value="Pekerjaan Utama">Pekerjaan Utama</option>
              <option value="Pengembangan Diri">Pengembangan Diri</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Langkah / Deskripsi Rencana</label>
          <textarea
            rows={3}
            placeholder="Tuliskan catatan detail atau langkah eksekusi..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Tambah Rencana Kerja
        </button>
      </form>

      {/* Daftar Workplan */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Rencana Kerja ({workplans.length})</h3>
        {workplans.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada rencana kerja. Yuk buat strategi suksesmu!</p>
        ) : (
          workplans.map(item => {
            const isDone = item.status === 'Selesai';
            const isInProgress = item.status === 'Sedang Berjalan';

            return (
              <div 
                key={item.id} 
                className={`border rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition ${
                  isDone ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleStatus(item.id, item.status)}
                      className={`mt-0.5 p-1 rounded-full transition shrink-0 cursor-pointer ${
                        isDone ? 'text-emerald-600 bg-emerald-100' : isInProgress ? 'text-indigo-600 bg-indigo-100' : 'text-slate-300 hover:text-indigo-500'
                      }`}
                      title="Klik untuk ubah status"
                    >
                      {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {item.title}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          {item.category}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-600 whitespace-pre-wrap mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteWorkplan(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0 cursor-pointer"
                    title="Hapus Rencana"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                    isDone ? 'bg-emerald-100 text-emerald-800' : isInProgress ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
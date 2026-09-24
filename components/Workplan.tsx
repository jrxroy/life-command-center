'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Calendar, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface WorkplanItem {
  id: string;
  title: string;
  description: string;
  category: string;
  target_date: string;
  status: string;
  created_at: string;
}

export function Workplan() {
  const [workplans, setWorkplans] = useState<WorkplanItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Side Hustle');
  const [targetDate, setTargetDate] = useState('');

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
    if (!title.trim() || !description.trim()) return;

    const { data, error } = await supabase
      .from('workplans')
      .insert([{
        title,
        description,
        category,
        target_date: targetDate || null,
        status: 'Belum Dimulai'
      }])
      .select();

    if (!error && data) {
      setWorkplans([data[0], ...workplans]);
      setTitle('');
      setDescription('');
      setTargetDate('');
    } else if (error) {
      alert('Gagal menyimpan workplan: ' + error.message);
    }
  };

  const updateStatus = async (id: string, currentStatus: string) => {
    let nextStatus = 'Belum Dimulai';
    if (currentStatus === 'Belum Dimulai') nextStatus = 'Sedang Dikerjakan';
    else if (currentStatus === 'Sedang Dikerjakan') nextStatus = 'Selesai';
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
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Rencana Kerja (Workplan)</h2>
        <span className="text-[11px] sm:text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
          🎯 Target & Strategi
        </span>
      </div>

      {/* Form Tambah Workplan (Mobile Friendly) */}
      <form onSubmit={addWorkplan} className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Judul Proyek / Target</label>
          <input
            type="text"
            placeholder="Contoh: Optimasi Meta Ads Shopee Affiliate..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              <option value="Side Hustle">Side Hustle</option>
              <option value="Pengembangan Aplikasi">Pengembangan Aplikasi</option>
              <option value="Karier & Profesional">Karier & Profesional</option>
              <option value="Keuangan & Aset">Keuangan & Aset</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Target Tenggat (Deadline)</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Langkah / Deskripsi Rencana</label>
          <textarea
            rows={3}
            placeholder="Tuliskan langkah-langkah eksekusi secara detail..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm"
        >
          <Plus size={18} /> Simpan Workplan
        </button>
      </form>

      {/* Daftar Workplan */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Rencana Kerja ({workplans.length})</h3>
        {workplans.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada workplan yang dibuat. Yuk susun strategimu!</p>
        ) : (
          workplans.map(item => {
            const isCompleted = item.status === 'Selesai';
            const isInProgress = item.status === 'Sedang Dikerjakan';
            
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 hover:border-amber-300 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 truncate">{item.title}</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                  </div>

                  <button
                    onClick={() => deleteWorkplan(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
                    title="Hapus Workplan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                  {item.target_date ? (
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar size={14} />
                      <span>Target: {new Date(item.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  ) : <span className="text-slate-400 italic">Tanpa deadline</span>}

                  <button
                    onClick={() => updateStatus(item.id, item.status)}
                    className={`w-full sm:w-auto px-3 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : isInProgress 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 size={14} />}
                    {isInProgress && <Clock size={14} />}
                    {!isCompleted && !isInProgress && <AlertCircle size={14} />}
                    <span>{item.status}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
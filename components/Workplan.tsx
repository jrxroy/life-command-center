'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Target, Plus, Trash2, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface WorkplanItem {
  id: string;
  title: string;
  category: string;
  deadline: string;
  description: string;
  status: string;
}

export function Workplan() {
  const [workplans, setWorkplans] = useState<WorkplanItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Side Hustle');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkplans();
  }, []);

  const fetchWorkplans = async () => {
    const { data, error } = await supabase.from('workplans').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching workplans:', error);
    } else {
      setWorkplans(data || []);
    }
  };

  const addWorkplan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.from('workplans').insert([
      {
        title,
        category,
        deadline: deadline || null,
        description,
        status: 'Belum Dimulai'
      }
    ]).select();

    if (error) {
      alert('Gagal menambah workplan: ' + error.message);
    } else if (data) {
      setWorkplans([data[0], ...workplans]);
      setTitle('');
      setDescription('');
      setDeadline('');
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, currentStatus: string) => {
    const statuses = ['Belum Dimulai', 'Sedang Dikerjakan', 'Selesai'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

    const { error } = await supabase
      .from('workplans')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      setWorkplans(workplans.map((w) => (w.id === id ? { ...w, status: nextStatus } : w)));
    }
  };

  const deleteWorkplan = async (id: string) => {
    const { error } = await supabase.from('workplans').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setWorkplans(workplans.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="text-orange-500" /> Rencana Kerja (Workplan)
        </h2>
      </div>

      {/* Form Tambah Workplan */}
      <form onSubmit={addWorkplan} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Judul Proyek / Target</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Optimasi Meta Ads Shopee Affiliate..."
            className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Side Hustle">Side Hustle</option>
              <option value="Pekerjaan Utama">Pekerjaan Utama</option>
              <option value="Pengembangan Diri">Pengembangan Diri</option>
              <option value="Keuangan">Keuangan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Tenggat (Deadline)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Langkah / Deskripsi Rencana</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tuliskan langkah-langkah eksekusi secara detail..."
            rows={3}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus size={18} /> {loading ? 'Menyimpan...' : 'Simpan Workplan'}
        </button>
      </form>

      {/* Daftar Workplan */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Daftar Rencana Kerja ({workplans.length})</h3>
        {workplans.length === 0 ? (
          <p className="text-center text-slate-400 py-8 italic">Belum ada workplan yang ditambahkan.</p>
        ) : (
          workplans.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">{item.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{item.category}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {item.deadline ? item.deadline : 'Tanpa deadline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, item.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      item.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : item.status === 'Sedang Dikerjakan'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.status === 'Selesai' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {item.status}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteWorkplan(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
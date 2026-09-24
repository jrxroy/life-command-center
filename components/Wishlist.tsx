'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Gift, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface WishlistItem {
  id: string;
  title: string;
  category: string;
  estimated_cost: number;
  target_date: string;
  status: string;
  created_at: string;
}

export function Wishlist() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Aset & Barang');
  const [estimatedCostDisplay, setEstimatedCostDisplay] = useState('');
  const [estimatedCostRaw, setEstimatedCostRaw] = useState(0);
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setWishlists(data);
  };

  const formatNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) {
      setEstimatedCostDisplay('');
      setEstimatedCostRaw(0);
      return;
    }
    const rawNumber = parseInt(numbers, 10);
    setEstimatedCostRaw(rawNumber);
    setEstimatedCostDisplay(new Intl.NumberFormat('id-ID').format(rawNumber));
  };

  const addWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from('wishlists')
      .insert([{
        title,
        category,
        estimated_cost: estimatedCostRaw,
        target_date: targetDate || null,
        status: 'Belum Tercapai'
      }])
      .select();

    if (!error && data) {
      setWishlists([data[0], ...wishlists]);
      setTitle('');
      setEstimatedCostDisplay('');
      setEstimatedCostRaw(0);
      setTargetDate('');
    } else if (error) {
      alert('Gagal menyimpan wishlist: ' + error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Tercapai' ? 'Belum Tercapai' : 'Tercapai';

    const { error } = await supabase
      .from('wishlists')
      .update({ status: nextStatus })
      .eq('id', id);

    if (!error) {
      setWishlists(wishlists.map(w => w.id === id ? { ...w, status: nextStatus } : w));
    }
  };

  const deleteWishlist = async (id: string) => {
    const { error } = await supabase.from('wishlists').delete().eq('id', id);
    if (!error) {
      setWishlists(wishlists.filter(w => w.id !== id));
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="bg-white text-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Wish List & Impian</h2>
        <span className="text-[11px] sm:text-xs font-semibold px-3 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-100">
          🎁 Target & Motivasi
        </span>
      </div>

      {/* Form Tambah Wishlist */}
      <form onSubmit={addWishlist} className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nama Impian / Barang / Target</label>
          <input
            type="text"
            placeholder="Contoh: Upgrade PC untuk Editing & Coding..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm font-medium"
            >
              <option value="Aset & Barang">Aset & Barang</option>
              <option value="Liburan & Pengalaman">Liburan & Pengalaman</option>
              <option value="Investasi & Finansial">Investasi & Finansial</option>
              <option value="Pribadi & Lainnya">Pribadi & Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Estimasi Biaya (Rp)</label>
            <input
              type="text"
              placeholder="Contoh: 5.000.000"
              value={estimatedCostDisplay}
              onChange={e => formatNumberInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Target Waktu</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Tambah ke Wish List
        </button>
      </form>

      {/* Daftar Wishlist */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Impian ({wishlists.length})</h3>
        {wishlists.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada daftar impian. Yuk tulis impianmu sekarang!</p>
        ) : (
          wishlists.map(item => {
            const isAchieved = item.status === 'Tercapai';

            return (
              <div 
                key={item.id} 
                className={`border rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                  isAchieved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 hover:border-pink-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleStatus(item.id, item.status)}
                    className={`mt-0.5 p-1 rounded-full transition shrink-0 cursor-pointer ${
                      isAchieved ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 hover:text-pink-500'
                    }`}
                    title="Ubah Status"
                  >
                    {isAchieved ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm truncate ${isAchieved ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-pink-600">
                        {item.estimated_cost > 0 ? formatRupiah(item.estimated_cost) : 'Tanpa estimasi'}
                      </span>
                      {item.target_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={13} />
                          <span>Target: {new Date(item.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    isAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {item.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteWishlist(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0 cursor-pointer"
                    title="Hapus Wishlist"
                  >
                    <Trash2 size={16} />
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
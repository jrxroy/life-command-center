'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Calendar, ChevronRight, X, Trash2, Edit3, Search, Download } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Journal {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export function Journaling() {
  const [journals, setJournals] = useState<Journal[]>([]);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Refleksi Harian');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('Refleksi Harian');

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setJournals(data);
  };

  const addJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const { data, error } = await supabase
      .from('journals')
      .insert([{ title, content, category }])
      .select();

    if (!error && data) {
      setJournals([data[0], ...journals]);
      setTitle('');
      setContent('');
    }
  };

  const deleteJournal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('journals').delete().eq('id', id);
    if (!error) {
      setJournals(journals.filter(j => j.id !== id));
      if (selectedJournal?.id === id) setSelectedJournal(null);
    }
  };

  const openEditModal = (journal: Journal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJournal(journal);
    setEditTitle(journal.title);
    setEditContent(journal.content);
    setEditCategory(journal.category);
  };

  const handleUpdateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal || !editTitle.trim() || !editContent.trim()) return;

    const { error } = await supabase
      .from('journals')
      .update({
        title: editTitle,
        content: editContent,
        category: editCategory,
      })
      .eq('id', editingJournal.id);

    if (!error) {
      setJournals(journals.map(j => j.id === editingJournal.id ? {
        ...j,
        title: editTitle,
        content: editContent,
        category: editCategory,
      } : j));
      setEditingJournal(null);
      if (selectedJournal?.id === editingJournal.id) {
        setSelectedJournal({
          ...selectedJournal,
          title: editTitle,
          content: editContent,
          category: editCategory,
        });
      }
    }
  };

  const exportAsTxt = (journal: Journal, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement('a');
    const file = new Blob([`JUDUL: ${journal.title}\nKATEGORI: ${journal.category}\nTANGGAL: ${journal.created_at}\n\n${journal.content}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${journal.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredJournals = journals.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || j.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white text-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Jurnal & Refleksi</h2>
        <span className="text-[11px] sm:text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
          📖 Ruang Pikiran
        </span>
      </div>

      {/* Form Tulis Jurnal Baru */}
      <form onSubmit={addJournal} className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Judul Jurnal</label>
          <input
            type="text"
            placeholder="Judul atau topik refleksi..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm font-medium"
          >
            <option value="Refleksi Harian">Refleksi Harian</option>
            <option value="Ide & Visi">Ide & Visi</option>
            <option value="Evaluasi Diri">Evaluasi Diri</option>
            <option value="Side Hustle Plan">Side Hustle Plan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Isi Jurnal / Catatan Panjang</label>
          <textarea
            rows={4}
            placeholder="Tuliskan isi jurnal secara mendetail..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Simpan Jurnal
        </button>
      </form>

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari arsip jurnal..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button type="button" onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Semua</button>
          <button type="button" onClick={() => setCategoryFilter('Refleksi Harian')} className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === 'Refleksi Harian' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Refleksi Harian</button>
          <button type="button" onClick={() => setCategoryFilter('Ide & Visi')} className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === 'Ide & Visi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Ide & Visi</button>
          <button type="button" onClick={() => setCategoryFilter('Evaluasi Diri')} className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === 'Evaluasi Diri' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Evaluasi Diri</button>
          <button type="button" onClick={() => setCategoryFilter('Side Hustle Plan')} className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === 'Side Hustle Plan' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Side Hustle Plan</button>
        </div>
      </div>

      {/* Daftar Jurnal */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arsip Jurnal Tersimpan ({filteredJournals.length})</h3>
        {filteredJournals.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Tidak ada jurnal yang ditemukan.</p>
        ) : (
          filteredJournals.map(journal => (
            <div
              key={journal.id}
              onClick={() => setSelectedJournal(journal)}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-800 group-hover:text-purple-700 transition truncate">
                    {journal.title}
                  </span>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-100 shrink-0">
                    {journal.category}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    <Calendar size={12} />
                    {new Date(journal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-slate-400 text-[11px] truncate hidden sm:inline">• Klik untuk baca selengkapnya</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => exportAsTxt(journal, e)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="Unduh .txt"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openEditModal(journal, e)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteJournal(journal.id, e)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-2 bg-slate-50 group-hover:bg-purple-50 text-slate-400 group-hover:text-purple-600 rounded-xl transition">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detail Jurnal */}
      {selectedJournal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 gap-2">
              <div className="space-y-1 min-w-0">
                <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                  {selectedJournal.category}
                </span>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-snug break-words">{selectedJournal.title}</h3>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1 pt-0.5">
                  <Calendar size={12} /> {new Date(selectedJournal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-2 overflow-y-auto flex-1 pr-1">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedJournal.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={(e) => exportAsTxt(selectedJournal, e)}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={14} /> Ekspor .txt
              </button>
              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Edit Jurnal */}
      {editingJournal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Edit Jurnal</h3>
              <button type="button" onClick={() => setEditingJournal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateJournal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Judul Jurnal</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  <option value="Refleksi Harian">Refleksi Harian</option>
                  <option value="Ide & Visi">Ide & Visi</option>
                  <option value="Evaluasi Diri">Evaluasi Diri</option>
                  <option value="Side Hustle Plan">Side Hustle Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Isi Jurnal</label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJournal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { BookOpen, Edit3, Save, Calendar, Sparkles } from 'lucide-react';

interface JournalEntry {
  id?: string;
  date: string;
  pagi_important: string;
  pagi_avoid: string;
  pagi_one_thing: string;
  malam_what_happened: string;
  malam_went_well: string;
  malam_went_wrong: string;
  malam_why: string;
  malam_learned: string;
  malam_tomorrow_action: string;
  minggu_time_spent: string;
  minggu_best_result: string;
  minggu_recurring_problem: string;
  minggu_bad_habit: string;
  minggu_to_avoid: string;
  minggu_stop_doing: string;
  minggu_start_doing: string;
  minggu_next_focus: string;
}

const todayStr = new Date().toISOString().split('T')[0];

export function Journaling() {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<'form' | 'story'>('form');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<JournalEntry>({
    date: todayStr,
    pagi_important: '',
    pagi_avoid: '',
    pagi_one_thing: '',
    malam_what_happened: '',
    malam_went_well: '',
    malam_went_wrong: '',
    malam_why: '',
    malam_learned: '',
    malam_tomorrow_action: '',
    minggu_time_spent: '',
    minggu_best_result: '',
    minggu_recurring_problem: '',
    minggu_bad_habit: '',
    minggu_to_avoid: '',
    minggu_stop_doing: '',
    minggu_start_doing: '',
    minggu_next_focus: '',
  });

  useEffect(() => {
    fetchJournal(selectedDate);
  }, [selectedDate]);

  const fetchJournal = async (date: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('date', date)
      .single();

    if (data && !error) {
      setFormData(data);
    } else {
      // Reset form jika tanggal belum ada isinya
      setFormData({
        date,
        pagi_important: '',
        pagi_avoid: '',
        pagi_one_thing: '',
        malam_what_happened: '',
        malam_went_well: '',
        malam_went_wrong: '',
        malam_why: '',
        malam_learned: '',
        malam_tomorrow_action: '',
        minggu_time_spent: '',
        minggu_best_result: '',
        minggu_recurring_problem: '',
        minggu_bad_habit: '',
        minggu_to_avoid: '',
        minggu_stop_doing: '',
        minggu_start_doing: '',
        minggu_next_focus: '',
      });
    }
    setLoading(false);
  };

  const handleChange = (field: keyof JournalEntry, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('journals')
      .upsert({ ...formData, date: selectedDate }, { onConflict: 'date' });

    if (error) {
      alert('Gagal menyimpan jurnal: ' + error.message);
    } else {
      alert('Jurnal berhasil disimpan!');
      setViewMode('story'); // Otomatis pindah ke mode cerita setelah simpan
    }
    setLoading(false);
  };

  const formatDateID = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6 text-slate-800">
      
      {/* Header & Navigasi Mode */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={22} /> Jurnal & Refleksi Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Jurnal harian memberi data, mingguan memberi pola.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'form' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 size={14} /> Isi
            </button>
            <button
              type="button"
              onClick={() => setViewMode('story')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'story' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} /> Baca Cerita
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-slate-400 text-sm italic">Memuat data jurnal...</p>
      ) : viewMode === 'form' ? (
        /* --- MODE FORM PENGISIAN --- */
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SESI PAGI */}
          <div className="bg-amber-50/50 border border-amber-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              🌅 PAGI — 3 Menit (Intensi & Fokus)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hari ini yang paling penting:</label>
                <input
                  type="text"
                  value={formData.pagi_important}
                  onChange={e => handleChange('pagi_important', e.target.value)}
                  placeholder="Tuliskan prioritas utama..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hal yang harus dihindari:</label>
                <input
                  type="text"
                  value={formData.pagi_avoid}
                  onChange={e => handleChange('pagi_avoid', e.target.value)}
                  placeholder="Distraksi atau kebiasaan yang ingin dijauhi..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kalau hari ini hanya berhasil melakukan satu hal:</label>
                <input
                  type="text"
                  value={formData.pagi_one_thing}
                  onChange={e => handleChange('pagi_one_thing', e.target.value)}
                  placeholder="Satu pencapaian mutlak hari ini..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SESI MALAM */}
          <div className="bg-indigo-50/50 border border-indigo-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
              🌙 MALAM — 7-10 Menit (Evaluasi Harian)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang terjadi hari ini?</label>
                <textarea
                  rows={2}
                  value={formData.malam_what_happened}
                  onChange={e => handleChange('malam_what_happened', e.target.value)}
                  placeholder="Ringkasan kejadian hari ini..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang berjalan baik?</label>
                  <input
                    type="text"
                    value={formData.malam_went_well}
                    onChange={e => handleChange('malam_went_well', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang tidak berjalan baik?</label>
                  <input
                    type="text"
                    value={formData.malam_went_wrong}
                    onChange={e => handleChange('malam_went_wrong', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kenapa hal tersebut terjadi?</label>
                  <input
                    type="text"
                    value={formData.malam_why}
                    onChange={e => handleChange('malam_why', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang saya pelajari?</label>
                  <input
                    type="text"
                    value={formData.malam_learned}
                    onChange={e => handleChange('malam_learned', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satu tindakan untuk besok:</label>
                <input
                  type="text"
                  value={formData.malam_tomorrow_action}
                  onChange={e => handleChange('malam_tomorrow_action', e.target.value)}
                  placeholder="Langkah konkret esok hari..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SESI MINGGUAN (Opsional / Audit Berkala) */}
          <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              📊 MINGGUAN — 20 Menit (Audit Pola & Evaluasi)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang paling banyak menghabiskan waktu?</label>
                <input
                  type="text"
                  value={formData.minggu_time_spent}
                  onChange={e => handleChange('minggu_time_spent', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang paling banyak memberi hasil?</label>
                <input
                  type="text"
                  value={formData.minggu_best_result}
                  onChange={e => handleChange('minggu_best_result', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Masalah apa yang terus berulang?</label>
                <input
                  type="text"
                  value={formData.minggu_recurring_problem}
                  onChange={e => handleChange('minggu_recurring_problem', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kebiasaan buruk apa yang muncul?</label>
                <input
                  type="text"
                  value={formData.minggu_bad_habit}
                  onChange={e => handleChange('minggu_bad_habit', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang harus berhenti dilakukan?</label>
                <input
                  type="text"
                  value={formData.minggu_stop_doing}
                  onChange={e => handleChange('minggu_stop_doing', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fokus utama minggu depan:</label>
                <input
                  type="text"
                  value={formData.minggu_next_focus}
                  onChange={e => handleChange('minggu_next_focus', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
          >
            <Save size={18} /> Simpan Jurnal
          </button>
        </form>
      ) : (
        /* --- MODE BACA CERITA NARATIF (1 FILE UTUH) --- */
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Catatan & Refleksi Harian</span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{formatDateID(selectedDate)}</h3>
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            {/* Paragraf Pagi */}
            <p>
              Pada sesi pagi hari ini, fokus utama yang paling penting ditetapkan adalah <strong className="text-slate-900">{formData.pagi_important || '...'}</strong>. 
              Hal utama yang perlu dihindari sepanjang hari adalah <strong className="text-slate-900">{formData.pagi_avoid || '...'}</strong>, 
              dengan target mutlak bahwa jika hari ini hanya berhasil melakukan satu hal, maka hal itu adalah <strong className="text-slate-900">{formData.pagi_one_thing || '...'}</strong>.
            </p>

            {/* Paragraf Malam */}
            {(formData.malam_what_happened || formData.malam_went_well) && (
              <p>
                Refleksi malam: {formData.malam_what_happened}. Hari ini, hal yang berjalan dengan baik yaitu <strong className="text-slate-900">{formData.malam_went_well || '...'}</strong>, 
                sementara yang kurang berjalan lancar adalah <strong className="text-slate-900">{formData.malam_went_wrong || '...'}</strong> karena <strong className="text-slate-900">{formData.malam_why || '...'}</strong>. 
                Pelajaran berharga yang bisa dipetik hari ini adalah <strong className="text-slate-900">{formData.malam_learned || '...'}</strong>. 
                Oleh karena itu, satu tindakan konkret untuk esok hari adalah <strong className="text-slate-900">{formData.malam_tomorrow_action || '...'}</strong>.
              </p>
            )}

            {/* Paragraf Mingguan */}
            {(formData.minggu_time_spent || formData.minggu_best_result) && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Audit & Pola Mingguan</span>
                <p>
                  Dalam evaluasi mingguan, waktu terbanyak dihabiskan untuk <strong className="text-slate-900">{formData.minggu_time_spent || '...'}</strong> dengan hasil terbaik dicapai pada <strong className="text-slate-900">{formData.minggu_best_result || '...'}</strong>. 
                  Kendala yang terus berulang adalah <strong className="text-slate-900">{formData.minggu_recurring_problem || '...'}</strong> akibat kemunculan kebiasaan buruk <strong className="text-slate-900">{formData.minggu_bad_habit || '...'}</strong>. 
                  Mulai sekarang, hal yang harus dihentikan adalah <strong className="text-slate-900">{formData.minggu_stop_doing || '...'}</strong>, dan fokus utama untuk minggu depan diarahkan pada <strong className="text-slate-900">{formData.minggu_next_focus || '...'}</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={14} /> Edit Jurnal Ini
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
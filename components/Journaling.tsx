'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { BookOpen, Edit3, Save, Calendar, Sparkles, Sun, Moon, BarChart3, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

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
  ai_story?: string;
}

const todayStr = new Date().toISOString().split('T')[0];

export function Journaling() {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<'form' | 'story'>('form');
  const [activeSection, setActiveSection] = useState<'pagi' | 'malam' | 'mingguan'>('pagi');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStory, setAiStory] = useState('');

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
    ai_story: '',
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
      setAiStory(data.ai_story || '');
    } else {
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
        ai_story: '',
      });
      setAiStory('');
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
      setViewMode('story');
      if (!aiStory) {
        await generateAIStory(formData, true);
      }
    }
    setLoading(false);
  };

  const generateAIStory = async (data: JournalEntry, saveToDb = true) => {
    setAiLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key Gemini (NEXT_PUBLIC_GEMINI_API_KEY) belum disetel di .env.local');
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Ubah data catatan jurnal harian/mingguan berikut menjadi sebuah narasi cerita reflektif yang hidup, mengalir, natural, memotivasi, dan tidak monoton. Jangan gunakan format poin-poin atau kuesioner tanya-jawab, melainkan rangkai menjadi paragraf cerita layaknya catatan harian pribadi yang elegan dan mendalam dalam bahasa Indonesia. Abaikan bagian yang kosong atau bernilai kosong.
        Data Jurnal Tanggal ${selectedDate}:
        - Pagi: Prioritas: "${data.pagi_important}", Dihindari: "${data.pagi_avoid}", Target: "${data.pagi_one_thing}".
        - Malam: Kejadian: "${data.malam_what_happened}", Berjalan baik: "${data.malam_went_well}", Kendala: "${data.malam_went_wrong}", Alasan: "${data.malam_why}", Pelajaran: "${data.malam_learned}", Aksi besok: "${data.malam_tomorrow_action}".
        - Mingguan: Waktu terbanyak: "${data.minggu_time_spent}", Hasil: "${data.minggu_best_result}", Masalah: "${data.minggu_recurring_problem}", Kebiasaan buruk: "${data.minggu_bad_habit}", Berhenti: "${data.minggu_stop_doing}", Fokus: "${data.minggu_next_focus}".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || 'Gagal merangkai cerita.';
      setAiStory(text);

      if (saveToDb) {
        await supabase
          .from('journals')
          .update({ ai_story: text })
          .eq('date', selectedDate);
      }
    } catch (err: any) {
      setAiStory('Terjadi kesalahan saat menghasilkan cerita AI: ' + err.message);
    }
    setAiLoading(false);
  };

  const formatDateID = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={22} /> Jurnal & Refleksi Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Pilih sesi pengisian sesuai waktu atau baca hasil ceritanya.</p>
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
              onClick={() => {
                setViewMode('story');
                if (!aiStory) generateAIStory(formData, true);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'story' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} /> Baca Cerita AI
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-slate-400 text-sm italic">Memuat data jurnal...</p>
      ) : viewMode === 'form' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSection('pagi')}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'pagi' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sun size={16} /> <span>Pagi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('malam')}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'malam' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Moon size={16} /> <span>Malam</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('mingguan')}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'mingguan' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 size={16} /> <span>Mingguan</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {activeSection === 'pagi' && (
              <div className="bg-amber-50/50 border border-amber-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  🌅 SESI PAGI — Intensi & Fokus Harian
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hari ini yang paling penting:</label>
                    <input
                      type="text"
                      value={formData.pagi_important}
                      onChange={e => handleChange('pagi_important', e.target.value)}
                      placeholder="Prioritas utama..."
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hal yang harus dihindari:</label>
                    <input
                      type="text"
                      value={formData.pagi_avoid}
                      onChange={e => handleChange('pagi_avoid', e.target.value)}
                      placeholder="Distraksi..."
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kalau hari ini hanya berhasil melakukan satu hal:</label>
                    <input
                      type="text"
                      value={formData.pagi_one_thing}
                      onChange={e => handleChange('pagi_one_thing', e.target.value)}
                      placeholder="Target mutlak..."
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'malam' && (
              <div className="bg-indigo-50/50 border border-indigo-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                  🌙 SESI MALAM — Evaluasi Harian
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Apa yang terjadi hari ini?</label>
                    <textarea
                      rows={2}
                      value={formData.malam_what_happened}
                      onChange={e => handleChange('malam_what_happened', e.target.value)}
                      placeholder="Ringkasan..."
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
                      placeholder="Langkah konkret..."
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'mingguan' && (
              <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 sm:p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  📊 SESI MINGGUAN — Audit Pola & Evaluasi Berkala
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Paling banyak menghabiskan waktu?</label>
                    <input
                      type="text"
                      value={formData.minggu_time_spent}
                      onChange={e => handleChange('minggu_time_spent', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Paling banyak memberi hasil?</label>
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
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
            >
              <Save size={18} /> Simpan Perubahan Jurnal
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 leading-relaxed">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={14} /> Cerita Reflektif AI Gemini
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{formatDateID(selectedDate)}</h3>
            </div>
            <button
              type="button"
              onClick={() => generateAIStory(formData, true)}
              disabled={aiLoading}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-indigo-200"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
              {aiLoading ? 'Merangkai...' : 'Ulangi Cerita AI'}
            </button>
          </div>

          <div className="text-sm text-slate-700 min-h-[150px] flex items-center">
            {aiLoading ? (
              <div className="w-full text-center py-10 space-y-2 text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto text-indigo-600" />
                <p className="text-xs italic">Gemini sedang merangkai datamu menjadi cerita yang mengalir...</p>
              </div>
            ) : aiStory ? (
              <div className="whitespace-pre-line space-y-4 leading-relaxed font-normal">
                {aiStory}
              </div>
            ) : (
              <p className="text-slate-400 italic text-center w-full">Belum ada cerita yang dihasilkan. Klik tombol di bawah atau simpan jurnal untuk membuat cerita.</p>
            )}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-200">
            {!aiStory && !aiLoading && (
              <button
                type="button"
                onClick={() => generateAIStory(formData, true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} /> Generate Cerita Sekarang
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <Edit3 size={14} /> Edit Jurnal Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
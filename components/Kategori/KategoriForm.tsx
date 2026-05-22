'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { KategoriZIS } from '@/types/lazis'; 

interface Props {
  initialData: KategoriZIS | null;
  onCancel: () => void;
  onSave: (payload: any, isEdit: boolean) => Promise<void>;
}

export default function KategoriForm({ initialData, onCancel, onSave }: Props) {
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        nama: initialData.nama,
        deskripsi: initialData.deskripsi
      });
    } else {
      setForm({ nama: '', deskripsi: '' });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    setIsSubmitting(true);
    const payload = {
      nama: form.nama.trim(),
      deskripsi: form.deskripsi.trim()
    };

    await onSave(payload, !!initialData);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 md:space-y-8 animate-scaleUp">
      {/* Form Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            {initialData ? 'Ubah Rincian Kategori ZIS' : 'Tambah Kategori ZIS Baru'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {initialData 
              ? 'Ubah parameter dan deskripsi kategori kas syariat ZIS' 
              : 'Buat kategori zakat, infaq, sedekah, fidyah, wakaf baru untuk operasional internal masjid'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>
      </div>

      {/* Spacious Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-5">
          {/* Input Nama Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Kategori ZIS *</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Contoh: Zakat Perdagangan, Wakaf Quran, Infaq Operasional..."
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
              required
            />
          </div>

          {/* Deskripsi / Peruntukan Syariat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Deskripsi / Peruntukan Syariat</label>
            <textarea
              value={form.deskripsi}
              onChange={(e) => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Tuliskan keterangan mengenai peruntukan syariat kategori ini, asnaf penerima, atau petunjuk penyalurannya..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium text-slate-700"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center gap-3 font-semibold text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 border border-slate-250 hover:bg-slate-55 rounded-xl text-slate-700 transition-all cursor-pointer"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer font-bold animate-pulseOnce disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-emerald-100" />
            {initialData ? 'Simpan Perubahan' : 'Buat Kategori Baru'}
          </button>
        </div>
      </form>
    </div>
  );
}
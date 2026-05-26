'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Check, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Penyaluran, KategoriZIS } from '@/types/lazis'; 

interface Props {
  initialData: Penyaluran | null;
  kategoriList: KategoriZIS[];
  dataSaldo: any;
  onCancel: () => void;
  onSave: (payload: any, isEdit: boolean) => void;
}

export default function PenyaluranForm({ 
  initialData, 
  kategoriList, 
  dataSaldo, 
  onCancel, 
  onSave 
}: Props) {
  const [form, setForm] = useState({
    namaMustahik: '',
    kategori: '',
    jenisPenyaluran: 'uang',
    jumlahUang: '',
    jumlahBeras: '',
    keterangan: '',
    // STATE BARU: RT & RW
    rt: '',
    rw: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpenKategori, setIsOpenKategori] = useState(false);
  const [errorValidasi, setErrorValidasi] = useState<string | null>(null);

  // Helper Format Rupiah
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Initialize data
  useEffect(() => {
    if (initialData) {
      let jenis = 'uang';
      const uangVal = Number(initialData.jumlahUang) || 0;
      const berasVal = Number(initialData.jumlahBeras) || 0;

      if (uangVal > 0 && berasVal > 0) jenis = 'keduanya';
      else if (berasVal > 0) jenis = 'beras';

      setForm({
        namaMustahik: initialData.namaMustahik,
        kategori: initialData.kategoriId,
        jenisPenyaluran: jenis,
        jumlahUang: uangVal > 0 ? String(uangVal) : '',
        jumlahBeras: berasVal > 0 ? String(berasVal) : '',
        keterangan: initialData.keterangan || '',
        rt: initialData.rt || '',
        rw: initialData.rw || ''
      });
    } else {
      setForm({
        namaMustahik: '',
        kategori: kategoriList[0]?.nama || '',
        jenisPenyaluran: 'uang',
        jumlahUang: '',
        jumlahBeras: '',
        keterangan: '',
        rt: '',
        rw: ''
      });
    }
  }, [initialData, kategoriList]);

  // Hapus error saat user mengetik angka baru
  useEffect(() => {
    setErrorValidasi(null);
  }, [form.jumlahUang, form.jumlahBeras, form.jenisPenyaluran]);

  // Ambil isi brankas khusus untuk kategori yang sedang dipilih di dropdown form
  const brankasKategoriIni = dataSaldo.brankas[form.kategori] || { uang: 0, beras: 0, nama: '' };
  
  // Hitung saldo maksimal dengan mempertimbangkan data transaksi yang sedang diedit (jika ada)
  const maxUang = initialData && initialData.kategoriId === form.kategori 
    ? brankasKategoriIni.uang + Number(initialData.jumlahUang) 
    : brankasKategoriIni.uang;
    
  const maxBeras = initialData && initialData.kategoriId === form.kategori 
    ? brankasKategoriIni.beras + Number(initialData.jumlahBeras) 
    : brankasKategoriIni.beras;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaMustahik.trim()) return;

    // --- LOGIKA VALIDASI SALDO BARU ---
    // Bersihkan format Rupiah sebelum dihitung
    const inputUang = form.jenisPenyaluran === 'beras' ? 0 : Number(form.jumlahUang.toString().replace(/\D/g, '')) || 0;
    const inputBeras = form.jenisPenyaluran === 'uang' ? 0 : Number(form.jumlahBeras) || 0;

    // Cek batas maksimal (sekarang maxUang dan maxBeras sudah dikenal di sini)
    if (inputUang > maxUang) {
      setErrorValidasi(`Penyaluran Gagal! Saldo Uang untuk kategori "${brankasKategoriIni.nama}" hanya tersisa ${formatRp(maxUang)}.`);
      return;
    }

    if (inputBeras > maxBeras) {
      setErrorValidasi(`Penyaluran Gagal! Saldo Beras untuk kategori "${brankasKategoriIni.nama}" hanya tersisa ${maxBeras} kg/Liter.`);
      return;
    }

    // --- JIKA LOLOS, LANJUTKAN SIMPAN ---
    setIsSubmitting(true);
    setTimeout(() => {
      const payload = {
        namaMustahik: form.namaMustahik.trim(),
        kategoriId: String(form.kategori),
        jumlahUang: inputUang,
        jumlahBeras: inputBeras,
        keterangan: form.keterangan.trim() || null,
        rt: form.rt.trim() || null,
        rw: form.rw.trim() || null
      };

      onSave(payload, !!initialData);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 md:space-y-8 animate-scaleUp">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl text-rose-600">📤</span>
            {initialData ? 'Ubah Rincian Penyaluran ZIS' : 'Catat Penyaluran ZIS Baru'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Mencatat penyaluran zakat, infaq, sedekah kepada mustahik/asnaf secara riil.</p>
        </div>
        <button onClick={onCancel} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      {errorValidasi && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{errorValidasi}</p>
        </div>
      )}

      {/* Tampilkan Info Saldo Tersedia sebagai panduan */}
      {/* Tampilkan Info Saldo Kategori Spesifik (SESUAI BRANKAS) */}
        <div className="flex gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Maks. Uang ({brankasKategoriIni.nama})
            </p>
            <p className="text-sm font-extrabold text-emerald-800">
              {formatRp(maxUang)}
            </p>
          </div>
          <div className="w-px bg-emerald-200"></div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Maks. Beras ({brankasKategoriIni.nama})
            </p>
            <p className="text-sm font-extrabold text-amber-700">
              {maxBeras} Liter
            </p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-5">
          {/* NAMA MUSTAHIK */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Penerima (Mustahik / Golongan) *</label>
            <input type="text" value={form.namaMustahik} onChange={(e) => setForm(prev => ({ ...prev, namaMustahik: e.target.value }))} placeholder="Masukkan nama penerima, dhuafa, atau asnaf..." className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800" required />
          </div>

          {/* RT / RW INPUT BARU */}
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">RT (Opsional)</label>
              <MapPin className="absolute left-3 top-10 w-4 h-4 text-slate-400" />
              <input type="text" value={form.rt} onChange={(e) => setForm(prev => ({ ...prev, rt: e.target.value }))} placeholder="001" className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800" />
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">RW (Opsional)</label>
              <MapPin className="absolute left-3 top-10 w-4 h-4 text-slate-400" />
              <input type="text" value={form.rw} onChange={(e) => setForm(prev => ({ ...prev, rw: e.target.value }))} placeholder="012" className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800" />
            </div>
          </div>

          {/* KATEGORI */}
          <div className="relative max-w-md">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sumber Kas ZIS Syariat</label>
            <button type="button" onClick={() => setIsOpenKategori(!isOpenKategori)} className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between">
              {/* Gunakan String() untuk membandingkan agar tidak error */}
              <span>{kategoriList.find(k => String(k.id) === String(form.kategori))?.nama || 'Pilih Kategori Syariat ZIS'}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenKategori ? 'rotate-180' : ''}`} />
            </button>
            {isOpenKategori && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenKategori(false)} />
                <ul className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-sm font-semibold text-slate-800 animate-scaleUp">
                  {kategoriList.map(k => (
                    <li 
                      key={k.id} 
                      // Simpan sebagai String agar sesuai dengan API Zod
                      onClick={() => { setForm(prev => ({ ...prev, kategori: String(k.id) })); setIsOpenKategori(false); }} 
                      className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${String(form.kategori) === String(k.id) ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''}`}
                    >
                      <span>{k.nama}</span>
                      {String(form.kategori) === String(k.id) && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* JENIS PENYALURAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jenis Penyaluran</label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl max-w-md">
              {['uang', 'beras', 'keduanya'].map((type) => (
                <button key={type} type="button" onClick={() => setForm(prev => ({ ...prev, jenisPenyaluran: type }))} className={`py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${form.jenisPenyaluran === type ? 'bg-white text-rose-800 shadow-sm border border-rose-100/30' : 'text-slate-500 hover:text-rose-800'}`}>{type}</button>
              ))}
            </div>
          </div>

          {/* INPUT ANGKA (Dengan format Rupiah) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(form.jenisPenyaluran === 'uang' || form.jenisPenyaluran === 'keduanya') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Nominal Uang Disalurkan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input type="text" value={form.jumlahUang} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setForm(prev => ({ ...prev, jumlahUang: val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '' })); }} placeholder="0" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-rose-700" required />
                </div>
              </div>
            )}
            {(form.jenisPenyaluran === 'beras' || form.jenisPenyaluran === 'keduanya') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Beras Disalurkan (kg/Liter)</label>
                <div className="relative">
                  <input type="number" step="0.1" value={form.jumlahBeras} onChange={(e) => setForm(prev => ({ ...prev, jumlahBeras: e.target.value }))} placeholder="0" className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-amber-800" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Ltr</span>
                </div>
              </div>
            )}
          </div>

          {/* KETERANGAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keterangan / Alasan Penyaluran</label>
            <textarea value={form.keterangan} onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))} placeholder="Contoh: Bantuan sembako dhuafa RT 02..." rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none font-medium text-slate-700" />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center gap-3 font-semibold text-xs">
          <button type="button" onClick={onCancel} className="px-5 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-700 transition-all cursor-pointer">Batalkan</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer font-bold">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin text-rose-300" /> Menyimpan...</> : <><Check className="w-4 h-4 text-rose-300" /> {initialData ? 'Simpan Perubahan' : 'Catat Penyaluran Sekarang'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
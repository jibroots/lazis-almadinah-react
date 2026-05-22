'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, ChevronDown, Check, UserPlus, X, Calculator, User } from 'lucide-react';
import { Penerimaan, KategoriZIS, UserAmil } from '@/types/lazis';

// Helper Regex Pengecekan Fitrah Asli
const extractFitrahData = (keterangan: string | null, item: Penerimaan) => {
  let baseKet = keterangan || '';
  let anggota: string[] = [];
  let infaq = 0;
  let opsi: 'beli_lokasi' | 'bawa_sendiri' = 'beli_lokasi';

  if (keterangan && keterangan.includes('Zakat Fitrah')) {
    const parts = keterangan.split(' | Zakat Fitrah');
    baseKet = parts[0].trim();
    const fitrahPart = parts[1] || keterangan;

    const anggotaMatch = fitrahPart.match(/\(\+ (.*?)\)/);
    if (anggotaMatch && anggotaMatch[1]) {
      anggota = anggotaMatch[1].split(', ').map(s => s.trim());
    }

    const infaqMatch = fitrahPart.match(/\(Termasuk Infaq Rp (.*?)\)/);
    if (infaqMatch && infaqMatch[1]) {
      infaq = parseInt(infaqMatch[1].replace(/\./g, ''), 10);
    }
  }

  if (Number(item.jumlahUang) === 0 && Number(item.jumlahBeras) > 0 && infaq === 0) {
    opsi = 'bawa_sendiri';
  }

  return { baseKet, anggota, infaq, opsi };
};

interface Props {
  initialData: Penerimaan | null;
  kategoriList: KategoriZIS[];
  currentUser: UserAmil | null;
  onCancel: () => void;
  onSave: (payload: any, receiptData: any, isEdit: boolean) => Promise<boolean>;
}

export default function PenerimaanForm({ initialData, kategoriList, currentUser, onCancel, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [form, setForm] = useState({
    nama: '',
    whatsapp: '',
    kategori: '',
    jenisDonasi: 'uang',
    jumlahUang: '',
    jumlahBeras: '',
    metode: 'Tunai',
    keterangan: '',
    amilPenerima: ''
  });

  const [isOpenKategori, setIsOpenKategori] = useState(false);
  const [isOpenMetode, setIsOpenMetode] = useState(false);

  // Zakat Fitrah Specific States
  const [isFitrahMode, setIsFitrahMode] = useState(false);
  const [opsiFitrah, setOpsiFitrah] = useState<'bawa_sendiri' | 'beli_lokasi'>('beli_lokasi');
  const [hargaBerasItem, setHargaBerasItem] = useState(15000);
  const [anggotaKeluarga, setAnggotaKeluarga] = useState<string[]>([]);
  const [anggotaInput, setAnggotaInput] = useState('');
  const [nominalBayar, setNominalBayar] = useState('');
  const [jadikanInfaq, setJadikanInfaq] = useState(true);

  // Zakat Fitrah Calculations
  const totalJiwa = 1 + anggotaKeluarga.length;
  const literPerJiwa = 3.5;
  const totalLiter = totalJiwa * literPerJiwa;
  const totalTagihanFitrah = opsiFitrah === 'beli_lokasi' ? totalLiter * hargaBerasItem : 0;
  const kembalian = (Number(nominalBayar.replace(/\D/g, '')) || 0) - totalTagihanFitrah;
  const infaqAmount = (kembalian > 0 && jadikanInfaq) ? kembalian : 0;

  // Initialize data on mount
  useEffect(() => {
    if (initialData) {
      const isFitrah = initialData.kategoriId.toLowerCase().includes('fitrah');
      if (isFitrah) {
        const { baseKet, anggota, infaq, opsi } = extractFitrahData(initialData.keterangan, initialData);
        const uangVal = Number(initialData.jumlahUang) || 0;
        const totalNominal = uangVal + infaq;

        setAnggotaKeluarga(anggota);
        setOpsiFitrah(opsi);
        setNominalBayar(totalNominal > 0 ? new Intl.NumberFormat('id-ID').format(totalNominal) : '');
        setJadikanInfaq(infaq > 0);
        setIsFitrahMode(true);

        setForm({
          nama: initialData.namaMuzakki,
          whatsapp: initialData.nomorHp || '',
          kategori: initialData.kategoriId,
          jenisDonasi: 'uang',
          jumlahUang: '',
          jumlahBeras: '',
          metode: initialData.metodePembayaran || 'Tunai',
          keterangan: baseKet === 'Zakat Fitrah' ? '' : baseKet,
          amilPenerima: initialData.amilPenerima || currentUser?.nama || ''
        });
      } else {
        let jenis = 'uang';
        const uangVal = Number(initialData.jumlahUang) || 0;
        const berasVal = Number(initialData.jumlahBeras) || 0;

        if (uangVal > 0 && berasVal > 0) jenis = 'keduanya';
        else if (berasVal > 0) jenis = 'beras';

        setAnggotaKeluarga([]);
        setNominalBayar('');
        setIsFitrahMode(false);

        setForm({
          nama: initialData.namaMuzakki,
          whatsapp: initialData.nomorHp || '',
          kategori: initialData.kategoriId,
          jenisDonasi: jenis,
          jumlahUang: uangVal > 0 ? new Intl.NumberFormat('id-ID').format(uangVal) : '',
          jumlahBeras: berasVal > 0 ? String(berasVal) : '',
          metode: initialData.metodePembayaran || 'Tunai',
          keterangan: initialData.keterangan || '',
          amilPenerima: initialData.amilPenerima || currentUser?.nama || ''
        });
      }
    } else {
      setForm({
        nama: '',
        whatsapp: '',
        kategori: kategoriList[0]?.nama || '',
        jenisDonasi: 'uang',
        jumlahUang: '',
        jumlahBeras: '',
        metode: 'Tunai',
        keterangan: '',
        amilPenerima: currentUser?.nama || ''
      });
      setAnggotaKeluarga([]);
      setAnggotaInput('');
      setNominalBayar('');
      setJadikanInfaq(true);
      setOpsiFitrah('beli_lokasi');
    }
  }, [initialData, kategoriList, currentUser]);

  // Check if Fitrah Mode Dynamically
  useEffect(() => {
    const kat = kategoriList.find(k => k.nama === form.kategori);
    if (kat && kat.nama.toLowerCase().includes('fitrah')) {
      setIsFitrahMode(true);
      setForm(prev => ({ ...prev, jenisDonasi: 'uang' }));
    } else {
      setIsFitrahMode(false);
    }
  }, [form.kategori, kategoriList]);

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'jumlahUang' | 'nominalBayar') => {
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '';
    if (field === 'jumlahUang') setForm(prev => ({ ...prev, jumlahUang: formatted }));
    else setNominalBayar(formatted);
  };

  const handleAddAnggota = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newName = anggotaInput.trim().replace(/,/g, '');
      if (newName !== '') {
        setAnggotaKeluarga((prev) => [...prev, newName]);
        setAnggotaInput('');
      }
    }
  };

  const removeAnggota = (idx: number) => {
    setAnggotaKeluarga(anggotaKeluarga.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    setIsSubmitting(true);
    let submitPayload: any = null;
    let receiptData: any = null;

    if (isFitrahMode) {
      const ketAnggota = anggotaKeluarga.length > 0 ? ` (+ ${anggotaKeluarga.join(', ')})` : '';
      const infaqText = infaqAmount > 0 ? ` (Termasuk Infaq Rp ${new Intl.NumberFormat('id-ID').format(infaqAmount)})` : '';
      const ketFitrah = `Zakat Fitrah ${totalJiwa} Jiwa${ketAnggota}${infaqText}`;
      
      submitPayload = {
        nama: form.nama.trim(),
        whatsapp: form.whatsapp.trim() || null,
        kategori: form.kategori,
        jumlahUang: opsiFitrah === 'beli_lokasi' ? totalTagihanFitrah : 0,
        jumlahBeras: totalLiter,
        metode: form.metode,
        keterangan: (form.keterangan ? form.keterangan.trim() + ' | ' : '') + ketFitrah,
        amilPenerima: form.amilPenerima || currentUser?.nama || 'Sistem'
      };

      receiptData = {
        ...submitPayload,
        isFitrah: true,
        totalJiwa,
        hargaBerasItem,
        nominalBayar: Number(nominalBayar.replace(/\D/g, '')),
        kembalian,
        infaqAmount,
        tanggal: new Date()
      };
    } else {
      const uangVal = form.jenisDonasi === 'beras' ? 0 : Number(String(form.jumlahUang).replace(/\D/g, '')) || 0;
      const berasVal = form.jenisDonasi === 'uang' ? 0 : Number(form.jumlahBeras) || 0;

      submitPayload = {
        nama: form.nama.trim(),
        whatsapp: form.whatsapp.trim() || null,
        kategori: form.kategori,
        jumlahUang: uangVal,
        jumlahBeras: berasVal,
        metode: form.metode,
        keterangan: form.keterangan.trim() || null,
        amilPenerima: form.amilPenerima || currentUser?.nama || 'Sistem'
      };

      receiptData = {
        ...submitPayload,
        isFitrah: false,
        tanggal: new Date()
      };
    }

    await onSave(submitPayload, receiptData, !!initialData);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 md:space-y-8 animate-scaleUp">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            {initialData ? 'Ubah Rincian Penerimaan ZIS' : 'Tambah Catatan Penerimaan ZIS'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {initialData 
              ? 'Ubah rincian pembayaran donasi dari muzakki secara aman di database cloud' 
              : 'Mencatat donasi masuk berupa uang tunai, transfer bank, QRIS, maupun beras fitrah'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Muzakki (Donatur) *</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Masukkan nama lengkap donatur..."
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">No WhatsApp / HP</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kategori Syariat ZIS</label>
              <button
                type="button"
                onClick={() => {
                  setIsOpenKategori(!isOpenKategori);
                  setIsOpenMetode(false);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>{form.kategori || 'Pilih Kategori Syariat ZIS'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenKategori ? 'rotate-180' : ''}`} />
              </button>
              {isOpenKategori && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsOpenKategori(false)} />
                  <ul className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-sm font-semibold text-slate-800 animate-scaleUp">
                    {kategoriList.map(k => (
                      <li
                        key={k.id}
                        onClick={() => {
                          setForm(prev => ({ ...prev, kategori: k.nama }));
                          setIsOpenKategori(false);
                        }}
                        className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                          form.kategori === k.nama ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                        }`}
                      >
                        <span>{k.nama}</span>
                        {form.kategori === k.nama && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {isFitrahMode ? (
            <div className="bg-emerald-50/70 rounded-2xl p-6 border border-emerald-150 space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-200/50">
                <Calculator className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-emerald-900 text-sm tracking-wide">KALKULATOR ZAKAT FITRAH (3.5 LITER / JIWA)</h3>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Opsi Pembayaran Beras</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setOpsiFitrah('beli_lokasi')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all ${opsiFitrah === 'beli_lokasi' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Membeli Beras di Lokasi (Tunai)</button>
                  <button type="button" onClick={() => setOpsiFitrah('bawa_sendiri')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all ${opsiFitrah === 'bawa_sendiri' ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Bawa Beras Sendiri</button>
                </div>
              </div>

              {opsiFitrah === 'beli_lokasi' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Harga Beras per Liter</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[15000, 16000, 17000].map((harga) => (
                      <button key={harga} type="button" onClick={() => setHargaBerasItem(harga)} className={`py-2 rounded-xl text-xs font-bold border transition-all ${hargaBerasItem === harga ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        Rp {harga.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggungan Anggota Keluarga (Opsional)</label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input type="text" value={anggotaInput} onChange={(e) => setAnggotaInput(e.target.value)} onKeyDown={handleAddAnggota} placeholder="Ketik nama lalu Enter atau koma (,)..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                </div>
                {anggotaKeluarga.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {anggotaKeluarga.map((nama, idx) => (
                      <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        {nama} <button type="button" onClick={() => removeAnggota(idx)} className="text-emerald-500 hover:text-emerald-900"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Total Jiwa (Muzakki + Anggota):</span>
                  <span className="text-emerald-800 text-sm">{totalJiwa} Jiwa</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Total Beras Dibutuhkan:</span>
                  <span className="text-amber-700 text-sm font-extrabold">{totalLiter} Liter</span>
                </div>
                {opsiFitrah === 'beli_lokasi' && (
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-dashed border-emerald-200">
                    <span className="text-slate-800 font-extrabold text-xs">TOTAL TAGIHAN ZAKAT:</span>
                    <span className="text-emerald-700 font-extrabold text-lg">Rp {totalTagihanFitrah.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {opsiFitrah === 'beli_lokasi' && (
                <div className="space-y-4 pt-4 border-t border-emerald-200/50">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nominal Uang yang Dibayarkan (Rp)</label>
                    <input type="text" value={nominalBayar} onChange={(e) => handleNominalChange(e, 'nominalBayar')} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-emerald-200 text-lg font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" required={opsiFitrah === 'beli_lokasi'} />
                  </div>

                  {kembalian > 0 && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/60 shadow-inner">
                      <div className="flex justify-between text-xs font-bold text-amber-900 mb-2">
                        <span>Sisa Kembalian:</span>
                        <span className="text-sm">Rp {kembalian.toLocaleString('id-ID')}</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-3 bg-white p-2.5 rounded-lg border border-amber-100 hover:bg-amber-100/50 transition-colors">
                        <input type="checkbox" checked={jadikanInfaq} onChange={(e) => setJadikanInfaq(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" />
                        <span className="text-xs font-extrabold text-slate-700">Jadikan sisa kembalian sebagai Infaq / Sedekah</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jenis Penerimaan Donasi</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl max-w-md">
                  {['uang', 'beras', 'keduanya'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, jenisDonasi: type }))}
                      className={`py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                        form.jenisDonasi === type
                          ? 'bg-white text-emerald-850 shadow-sm border border-emerald-100/30'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(form.jenisDonasi === 'uang' || form.jenisDonasi === 'keduanya') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Nominal Uang (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={form.jumlahUang}
                        onChange={(e) => handleNominalChange(e, 'jumlahUang')}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-emerald-700"
                        required={form.jenisDonasi === 'uang' || form.jenisDonasi === 'keduanya'}
                      />
                    </div>
                  </div>
                )}

                {(form.jenisDonasi === 'beras' || form.jenisDonasi === 'keduanya') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Beras (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={form.jumlahBeras}
                        onChange={(e) => setForm(prev => ({ ...prev, jumlahBeras: e.target.value }))}
                        placeholder="0"
                        className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-amber-800"
                        required={form.jenisDonasi === 'beras' || form.jenisDonasi === 'keduanya'}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="relative max-w-md">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Metode Penyetoran</label>
            <button
              type="button"
              onClick={() => {
                setIsOpenMetode(!isOpenMetode);
                setIsOpenKategori(false);
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between"
            >
              <span>{form.metode === 'Tunai' ? 'Tunai / Cash' : form.metode}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenMetode ? 'rotate-180' : ''}`} />
            </button>
            {isOpenMetode && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenMetode(false)} />
                <ul className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-sm font-semibold text-slate-800 animate-scaleUp">
                  {[
                    { value: 'Tunai', label: 'Tunai / Cash' },
                    { value: 'Transfer Bank', label: 'Transfer Bank' },
                    { value: 'QRIS', label: 'QRIS' }
                  ].map(opt => (
                    <li
                      key={opt.value}
                      onClick={() => {
                        setForm(prev => ({ ...prev, metode: opt.value }));
                        setIsOpenMetode(false);
                      }}
                      className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                        form.metode === opt.value ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                      }`}
                    >
                      <span>{opt.label}</span>
                      {form.metode === opt.value && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keterangan Tambahan</label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Masukkan keterangan pelengkap jika ada (misal: atas nama keluarga)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium text-slate-700"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">Amil / Petugas Penerima</div>
              <div className="text-sm font-bold text-slate-800">{form.amilPenerima || 'Sistem'}</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center gap-3 font-semibold text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-700 transition-all cursor-pointer"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer font-bold"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin text-emerald-300" /> Menyimpan...</>
            ) : (
              <><Check className="w-4 h-4 text-emerald-300" /> {initialData ? 'Simpan Perubahan' : 'Catat Donasi Sekarang'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Loader2, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  User, 
  Check, 
  ArrowLeft,
  ChevronDown,
  Receipt,
  UserPlus,
  Send,
  Calculator
} from 'lucide-react';
import { Penerimaan, KategoriZIS, UserAmil } from '../types/lazis';

interface PenerimaanViewProps {
  penerimaanList: Penerimaan[];
  kategoriList: KategoriZIS[];
  currentUser: UserAmil | null;
  isLoading: boolean;
  onAdd: (newData: any) => Promise<boolean>;
  onEdit: (updatedData: any) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  formatRupiah: (num: number) => string;
}

// Helper untuk memecah teks keterangan Fitrah kembali menjadi state
const extractFitrahData = (keterangan: string | null, item: Penerimaan) => {
  let baseKet = keterangan || '';
  let anggota: string[] = [];
  let infaq = 0;
  let opsi: 'beli_lokasi' | 'bawa_sendiri' = 'beli_lokasi';

  if (keterangan && keterangan.includes('Zakat Fitrah')) {
    const parts = keterangan.split(' | Zakat Fitrah');
    baseKet = parts[0].trim(); // Mengambil keterangan aslinya saja
    const fitrahPart = parts[1] || keterangan;

    // Cari nama anggota di dalam kurung (+ ...)
    const anggotaMatch = fitrahPart.match(/\(\+ (.*?)\)/);
    if (anggotaMatch && anggotaMatch[1]) {
      anggota = anggotaMatch[1].split(', ').map(s => s.trim());
    }

    // Cari nominal infaq
    const infaqMatch = fitrahPart.match(/\(Termasuk Infaq Rp (.*?)\)/);
    if (infaqMatch && infaqMatch[1]) {
      infaq = parseInt(infaqMatch[1].replace(/\./g, ''), 10);
    }
  }

  // Jika uangnya 0 dan berasnya ada, berarti bawa sendiri
  if (Number(item.jumlahUang) === 0 && Number(item.jumlahBeras) > 0 && infaq === 0) {
    opsi = 'bawa_sendiri';
  }

  return { baseKet, anggota, infaq, opsi };
};

export default function PenerimaanView({
  penerimaanList,
  kategoriList,
  currentUser,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  formatRupiah
}: PenerimaanViewProps) {
  // Navigation State: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals visibility states (Detail & Delete remain as popups)
  const [detailItem, setDetailItem] = useState<Penerimaan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Penerimaan | null>(null);
  const [editingItem, setEditingItem] = useState<Penerimaan | null>(null);

  // Form States (Add/Edit)
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

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'jumlahUang' | 'nominalBayar') => {
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '';
    if (field === 'jumlahUang') setForm(prev => ({ ...prev, jumlahUang: formatted }));
    else setNominalBayar(formatted);
  };

  const handleSendWA = async (item: Penerimaan) => {
    if (!item.nomorHp) {
      alert('Nomor WhatsApp tidak tersedia untuk donatur ini.');
      return;
    }

    setIsGeneratingStruk(true);
    setGeneratingItemId(item.id);

    const totalRp = Number(item.jumlahUang) || 0;
    const totalKg = Number(item.jumlahBeras) || 0;

    try {
      const res = await fetch('/api/generate-struk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      const waNumber = item.nomorHp.replace(/\D/g, '').replace(/^0/, '62');

      // Build base text message
      const nominalText = [
        totalRp > 0 ? `*Rp ${new Intl.NumberFormat('id-ID').format(totalRp)}*` : '',
        totalKg > 0 ? `*Beras ${totalKg} kg*` : '',
      ].filter(Boolean).join(' dan ');

      if (!res.ok) {
        // Fallback: kirim WA tanpa link PDF
        const textFallback = `Assalamu'alaikum Wr. Wb.\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${item.namaMuzakki}* sejumlah ${nominalText} untuk kategori *${item.kategoriId}*.\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga.\nTerima kasih.\n\n_Pesan otomatis dari LAZIS Al-Madinah_`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(textFallback)}`, '_blank');
        return;
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/pdf')) {
        // Supabase not configured: download PDF directly then send WA without link
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `struk-lazis-${item.id}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);

        const textNoLink = `Assalamu'alaikum Wr. Wb.\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${item.namaMuzakki}* sejumlah ${nominalText} untuk kategori *${item.kategoriId}*.\n\n_Struk telah diunduh — lampirkan file PDF secara manual._\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga. Aamiin.\n\n_LAZIS Al-Madinah_`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(textNoLink)}`, '_blank');
        return;
      }

      const json = await res.json();
      const pdfUrl: string = json.url || '';

      const text = `Assalamu'alaikum Wr. Wb.\n\n🕌 *LAZIS AL-MADINAH*\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${item.namaMuzakki}* sejumlah ${nominalText} untuk kategori *${item.kategoriId}*.\n\n📄 *Struk Digital:*\n${pdfUrl}\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga. Aamiin.\n\n_Wassalamu'alaikum Wr. Wb._\n_Amil LAZIS Al-Madinah_`;

      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('[handleSendWA] Error:', err);
      // Graceful fallback
      const waNumber = item.nomorHp.replace(/\D/g, '').replace(/^0/, '62');
      const nominalText = [
        totalRp > 0 ? `*Rp ${new Intl.NumberFormat('id-ID').format(totalRp)}*` : '',
        totalKg > 0 ? `*Beras ${totalKg} kg*` : '',
      ].filter(Boolean).join(' dan ');
      const textFallback = `Assalamu'alaikum Wr. Wb.\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${item.namaMuzakki}* sejumlah ${nominalText} untuk kategori *${item.kategoriId}*.\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga.\nTerima kasih.\n\n_Pesan otomatis dari LAZIS Al-Madinah_`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(textFallback)}`, '_blank');
    } finally {
      setIsGeneratingStruk(false);
      setGeneratingItemId(null);
    }
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingStruk, setIsGeneratingStruk] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<number | null>(null);
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
  const [fitrahReceipt, setFitrahReceipt] = useState<any>(null);

  // Zakat Fitrah Calculations
  const totalJiwa = 1 + anggotaKeluarga.length;
  const literPerJiwa = 3.5;
  const totalLiter = totalJiwa * literPerJiwa;
  const totalTagihanFitrah = opsiFitrah === 'beli_lokasi' ? totalLiter * hargaBerasItem : 0;
  const kembalian = (Number(nominalBayar.replace(/\D/g, '')) || 0) - totalTagihanFitrah;
  const infaqAmount = (kembalian > 0 && jadikanInfaq) ? kembalian : 0;

  // Initialize kategori & amil
  useEffect(() => {
    setForm(prev => ({
      ...prev, 
      kategori: prev.kategori || (kategoriList.length > 0 ? kategoriList[0].nama : ''),
      amilPenerima: prev.amilPenerima || currentUser?.nama || ''
    }));
  }, [kategoriList, currentUser]);

  // Check if Fitrah Mode
  useEffect(() => {
    const kat = kategoriList.find(k => k.nama === form.kategori);
    if (kat && kat.nama.toLowerCase().includes('fitrah')) {
      setIsFitrahMode(true);
      setForm(prev => ({ ...prev, jenisDonasi: 'uang' }));
    } else {
      setIsFitrahMode(false);
    }
  }, [form.kategori, kategoriList]);

  const handleAddAnggota = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = anggotaInput.trim();
      if (val && !anggotaKeluarga.includes(val)) {
        setAnggotaKeluarga([...anggotaKeluarga, val]);
      }
      setAnggotaInput('');
    }
  };

  const removeAnggota = (idx: number) => {
    setAnggotaKeluarga(anggotaKeluarga.filter((_, i) => i !== idx));
  };

  // Reset Form helper
  const resetForm = () => {
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
  };

  // Open Edit Form and populate it
  const handleOpenEdit = (item: Penerimaan) => {
    const isFitrah = item.kategoriId.toLowerCase().includes('fitrah');

    if (isFitrah) {
      const { baseKet, anggota, infaq, opsi } = extractFitrahData(item.keterangan, item);
      const uangVal = Number(item.jumlahUang) || 0;
      const totalNominal = uangVal + infaq; // Kembalikan nilai total uang yang disetor

      setAnggotaKeluarga(anggota);
      setOpsiFitrah(opsi);
      setNominalBayar(totalNominal > 0 ? new Intl.NumberFormat('id-ID').format(totalNominal) : '');
      setJadikanInfaq(infaq > 0);
      setIsFitrahMode(true);

      setForm({
        nama: item.namaMuzakki,
        whatsapp: item.nomorHp || '',
        kategori: item.kategoriId,
        jenisDonasi: 'uang',
        jumlahUang: '',
        jumlahBeras: '',
        metode: item.metodePembayaran || 'Tunai',
        keterangan: baseKet === 'Zakat Fitrah' ? '' : baseKet, // Bersihkan jika tidak ada keterangan tambahan
        amilPenerima: item.amilPenerima || currentUser?.nama || ''
      });
    } else {
      let jenis = 'uang';
      const uangVal = Number(item.jumlahUang) || 0;
      const berasVal = Number(item.jumlahBeras) || 0;

      if (uangVal > 0 && berasVal > 0) jenis = 'keduanya';
      else if (berasVal > 0) jenis = 'beras';

      setAnggotaKeluarga([]);
      setNominalBayar('');
      setIsFitrahMode(false);

      setForm({
        nama: item.namaMuzakki,
        whatsapp: item.nomorHp || '',
        kategori: item.kategoriId,
        jenisDonasi: jenis,
        jumlahUang: uangVal > 0 ? new Intl.NumberFormat('id-ID').format(uangVal) : '',
        jumlahBeras: berasVal > 0 ? String(berasVal) : '',
        metode: item.metodePembayaran || 'Tunai',
        keterangan: item.keterangan || '',
        amilPenerima: item.amilPenerima || currentUser?.nama || ''
      });
    }

    setEditingItem(item);
    setViewMode('edit');
  };

  // Handle Add/Edit Submissions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    setIsSubmitting(true);
    let success = false;
    let submitPayload: any = null;

    if (isFitrahMode) {
      // FITRAH FLOW (Tambah & Edit)
      const ketAnggota = anggotaKeluarga.length > 0 ? ` (+ ${anggotaKeluarga.join(', ')})` : '';
      const infaqText = infaqAmount > 0 ? ` (Termasuk Infaq Rp ${new Intl.NumberFormat('id-ID').format(infaqAmount)})` : '';
      const ketFitrah = `Zakat Fitrah ${totalJiwa} Jiwa${ketAnggota}${infaqText}`;
      
      submitPayload = {
        nama: form.nama.trim(),
        whatsapp: form.whatsapp.trim() || null,
        kategori: form.kategori,
        jumlahUang: opsiFitrah === 'beli_lokasi' ? totalTagihanFitrah : 0, // Hanya simpan uang zakatnya
        jumlahBeras: totalLiter,
        metode: form.metode,
        keterangan: (form.keterangan ? form.keterangan.trim() + ' | ' : '') + ketFitrah,
        amilPenerima: form.amilPenerima || currentUser?.nama || 'Sistem'
      };

      if (editingItem) {
        success = await onEdit({ ...submitPayload, id: editingItem.id });
        if (success) {
          setViewMode('list');
          setEditingItem(null);
          resetForm();
        }
      } else {
        success = await onAdd(submitPayload);
        if (success) {
           setViewMode('list');
           setFitrahReceipt({
             ...submitPayload,
             isFitrah: true,
             totalJiwa,
             hargaBerasItem,
             nominalBayar: Number(nominalBayar.replace(/\D/g, '')),
             kembalian,
             infaqAmount,
             tanggal: new Date()
           });
           resetForm();
        }
      }
    } else {
      // NORMAL FLOW
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

      if (editingItem) {
        // -- Mode Edit
        success = await onEdit({ ...submitPayload, id: editingItem.id });
        if (success) {
          setViewMode('list');
          setEditingItem(null);
          resetForm();
        }
      } else {
        // -- Mode Tambah
        success = await onAdd(submitPayload);
        if (success) {
          setViewMode('list');
          setFitrahReceipt({
            ...submitPayload,
            isFitrah: false,
            tanggal: new Date()
          });
          resetForm();
        }
      }
    }
    setIsSubmitting(false);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    const success = await onDelete(deletingItem.id);
    setIsSubmitting(false);
    if (success) {
      setDeletingItem(null);
    }
  };

  // Filter & Search
  const filtered = penerimaanList.filter(item => {
    const s = searchQuery.toLowerCase();
    return (
      item.namaMuzakki.toLowerCase().includes(s) ||
      item.kategoriId.toLowerCase().includes(s) ||
      (item.nomorHp && item.nomorHp.includes(s))
    );
  });

  // Pagination calculation
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [searchQuery, totalPages]);

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // RENDERING FORM ADD / EDIT PAGE
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 md:space-y-8 animate-scaleUp">
        {/* Form Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-2xl">📥</span>
              {viewMode === 'edit' ? 'Ubah Rincian Penerimaan ZIS' : 'Tambah Catatan Penerimaan ZIS'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {viewMode === 'edit' 
                ? 'Ubah rincian pembayaran donasi dari muzakki secara aman di database cloud' 
                : 'Mencatat donasi masuk berupa uang tunai, transfer bank, QRIS, maupun beras fitrah'}
            </p>
          </div>
          <button
            onClick={() => {
              setViewMode('list');
              setEditingItem(null);
              resetForm();
            }}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer self-start sm:self-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        </div>

        {/* Spacious Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="space-y-5">
            {/* Input Nama Muzakki */}
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

            {/* Whatsapp & Kategori Grid */}
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

            {/* ZAKAT FITRAH CUSTOM FLOW ATAU DONASI BIASA */}
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
                {/* Jenis Donasi Selector */}
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

                {/* Jumlah Uang & Beras Grid */}
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

            {/* Metode Pembayaran */}
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

            {/* Keterangan Tambahan */}
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

            {/* Amil Penerima Info */}
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

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center gap-3 font-semibold text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setEditingItem(null);
                resetForm();
              }}
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  {viewMode === 'edit' ? 'Simpan Perubahan' : 'Catat Donasi Sekarang'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // RENDERING LIST PAGE (DEFAULT VIEW)
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
      
      {/* Table Title Bar with Add Data button */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            Penerimaan Kas ZIS (Muzakki)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Kelola riwayat dana masuk serta donasi langsung masjid</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Live Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Muzakki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800"
            />
          </div>

          <button
            onClick={() => {
              resetForm();
              setViewMode('add');
            }}
            className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            Tambah Penerimaan
          </button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="overflow-x-auto px-2 pb-2">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3 font-semibold">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-700" />
            Memuat arsip data muzakki...
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <span className="text-4xl">📭</span>
            Tidak ada transaksi penerimaan ZIS ditemukan.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-700 font-extrabold uppercase tracking-wider">
                <th className="p-4 pl-6">Tanggal</th>
                <th className="p-4">Muzakki (Donatur)</th>
                <th className="p-4">Kategori ZIS</th>
                <th className="p-4 text-right">Jumlah Penerimaan</th>
                <th className="p-4">Metode & Amil</th>
                <th className="p-4 text-center pr-6">Pilihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-700 font-bold whitespace-nowrap">
                    {new Date(item.tanggalPenerimaan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="font-extrabold text-slate-800">{item.namaMuzakki}</div>
                    {item.nomorHp && <div className="text-[11px] text-slate-600 font-bold mt-0.5">{item.nomorHp}</div>}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-850 font-extrabold border border-emerald-100/40 uppercase tracking-wide text-[10px]">
                      {item.kategoriId}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold">
                    {Number(item.jumlahUang) > 0 && <div className="text-emerald-700 font-extrabold">{formatRupiah(Number(item.jumlahUang))}</div>}
                    {Number(item.jumlahBeras) > 0 && <div className="text-amber-800 font-extrabold">🌾 {item.jumlahBeras} L</div>}
                  </td>
                  <td className="p-4 text-slate-700 font-bold">
                    <div>{item.metodePembayaran}</div>
                    <div className="text-[10px] text-slate-500 font-extrabold mt-1 flex items-center gap-1"><User className="w-3 h-3 text-emerald-500"/>{item.amilPenerima || 'Sistem'}</div>
                  </td>
                  <td className="p-4 text-center pr-6 whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      {item.nomorHp && (
                        <button
                          onClick={() => handleSendWA(item)}
                          disabled={isGeneratingStruk && generatingItemId === item.id}
                          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200/50 bg-emerald-50/20 disabled:opacity-60 disabled:cursor-wait"
                          title={isGeneratingStruk && generatingItemId === item.id ? 'Membuat struk PDF...' : 'Kirim Struk via WA'}
                        >
                          {isGeneratingStruk && generatingItemId === item.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => setDetailItem(item)}
                        className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200 bg-slate-50"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200/50 bg-emerald-50/20"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-200/50 bg-rose-50/20"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <div>
            Menampilkan <span className="text-slate-800">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span> sampai{' '}
            <span className="text-slate-800">{Math.min(filtered.length, currentPage * itemsPerPage)}</span> dari{' '}
            <span className="text-slate-800">{filtered.length}</span> data muzakki
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
            >
              Sebelumnya
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-9 h-9 rounded-xl border text-center font-extrabold flex items-center justify-center cursor-pointer transition-all ${
                  currentPage === idx + 1
                    ? 'bg-emerald-900 border-emerald-950 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL DETAIL VIEW (REMAINS POPUP)
          ==================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scaleUp">
            
            <div className="bg-emerald-600 text-white px-6 py-6 text-center space-y-2 relative">
              <button 
                onClick={() => setDetailItem(null)} 
                className="absolute right-4 top-4 text-white/80 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-3xl inline-block p-2.5 bg-white/10 rounded-full border border-white/20">🕌</div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-300">Detail Arsip Penerimaan</h3>
              <h2 className="text-lg font-bold text-white leading-5">SIM LAZIS AL-MADINAH</h2>
            </div>

            <div className="p-6 space-y-6 text-slate-750">
              
              {/* PENGECEKAN TAMPILAN FITRAH vs NORMAL */}
              {detailItem.kategoriId.toLowerCase().includes('fitrah') ? (
                (() => {
                  const { baseKet, anggota, infaq } = extractFitrahData(detailItem.keterangan, detailItem);
                  const totalJiwa = 1 + anggota.length;
                  return (
                    <div className="space-y-4 text-xs font-bold bg-slate-50 p-5 rounded-2xl border border-slate-150">
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4" />Donatur Utama:</span>
                        <span className="text-slate-800 text-sm font-extrabold">{detailItem.namaMuzakki}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Tanggungan Zakat:</span>
                        <div className="text-right">
                          <span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md block">{totalJiwa} Jiwa</span>
                          {anggota.length > 0 && <span className="text-[10px] text-slate-500 mt-1 block">({anggota.join(', ')})</span>}
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5">🌾 Zakat Beras:</span>
                        <span className="text-amber-700 text-sm font-extrabold">{detailItem.jumlahBeras} Liter</span>
                      </div>
                      {Number(detailItem.jumlahUang) > 0 && (
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                          <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="w-4 h-4" />Nilai Zakat Uang:</span>
                          <span className="text-slate-800 text-sm font-extrabold">{formatRupiah(Number(detailItem.jumlahUang))}</span>
                        </div>
                      )}
                      {infaq > 0 && (
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                          <span className="flex items-center gap-1.5 text-amber-700">✨ Infaq Tambahan:</span>
                          <span className="text-amber-700 text-sm font-extrabold bg-amber-100 px-2 py-0.5 rounded-md">{formatRupiah(infaq)}</span>
                        </div>
                      )}
                      {baseKet && (
                         <div className="pt-2 text-[11px] text-slate-500">
                           <span className="block uppercase tracking-wider mb-1">Catatan:</span>
                           {baseKet}
                         </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* --- TAMPILAN NORMAL --- */
                <>
                  <div className="text-center py-3 border-b border-dashed border-slate-200 bg-emerald-50/30 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1">TOTAL DONASI DITERIMA</span>
                    <div className="text-2xl font-extrabold text-emerald-700">
                      {Number(detailItem.jumlahUang) > 0 ? formatRupiah(Number(detailItem.jumlahUang)) : ''}
                    </div>
                    {Number(detailItem.jumlahBeras) > 0 && (
                      <div className="text-base font-extrabold text-amber-800 mt-1">🌾 {detailItem.jumlahBeras} kg Beras</div>
                    )}
                  </div>
                  {/* ... (Pertahankan detail normal Anda di sini, hapus komentar ini dan paste info normal Anda) ... */}
                </>
              )}

              {/* ... Bagian Info Tanggal & Pembayaran Bawah ... */}
              <div className="space-y-4 text-xs font-bold pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal:</span>
                  <span className="font-extrabold text-slate-800">
                    {new Date(detailItem.tanggalPenerimaan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {!detailItem.kategoriId.toLowerCase().includes('fitrah') && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5">⚖️ Kategori:</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-150 uppercase text-[10px]">{detailItem.kategoriId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Pembayaran:</span>
                  <span className="font-extrabold text-slate-800">{detailItem.metodePembayaran} via {detailItem.amilPenerima || 'Sistem'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={() => setDetailItem(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-slate-200">
                  Tutup Arsip
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL CONFIRM DELETE (REMAINS POPUP)
          ==================================================== */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scaleUp p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-2xl mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-800">Hapus Transaksi Penerimaan</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus data penerimaan ZIS dari{' '}
                <span className="font-bold text-slate-800">{deletingItem.namaMuzakki}</span>? Data akan terhapus permanen dari server database cloud.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 font-bold text-xs">
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-700 cursor-pointer transition-all"
              >
                Batalkan
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL KUITANSI DIGITAL (UNIVERSAL: FITRAH & NORMAL)
          ==================================================== */}
      {fitrahReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 animate-scaleUp">
            
            <div className="bg-emerald-700 text-white px-6 py-6 text-center space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
              <button onClick={() => setFitrahReceipt(null)} className="absolute right-4 top-4 text-white/80 hover:text-white cursor-pointer p-1 z-10 bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <div className="text-4xl inline-block p-4 bg-white/10 rounded-full border border-white/20 relative z-10 shadow-lg">🧾</div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-200 relative z-10 mt-3">KUITANSI DIGITAL BERHASIL</h3>
              <h2 className="text-xl font-bold text-white relative z-10">
                {fitrahReceipt.isFitrah ? 'Zakat Fitrah Diterima' : 'Penerimaan Donasi Diterima'}
              </h2>
            </div>

            <div className="p-6 space-y-6 text-slate-750">
              <div className="space-y-4 text-xs font-bold bg-slate-50 p-5 rounded-2xl border border-slate-150">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <span className="text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4" />Donatur Utama:</span><span className="text-slate-800 text-sm font-extrabold">{fitrahReceipt.nama}</span>
                </div>
                
                {fitrahReceipt.isFitrah ? (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Total Tanggungan Zakat:</span><span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">{fitrahReceipt.totalJiwa} Jiwa</span>
                  </div>
                ) : (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5">⚖️ Kategori Donasi:</span><span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md uppercase">{fitrahReceipt.kategori}</span>
                  </div>
                )}

                {fitrahReceipt.jumlahUang > 0 && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="w-4 h-4" />Nilai Donasi Uang:</span><span className="text-slate-800 text-sm font-extrabold">{formatRupiah(fitrahReceipt.jumlahUang)}</span>
                  </div>
                )}
                {fitrahReceipt.jumlahBeras > 0 && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5">🌾 Nilai Donasi Beras:</span><span className="text-amber-700 text-sm font-extrabold">{fitrahReceipt.jumlahBeras} {fitrahReceipt.isFitrah ? 'Liter' : 'kg'}</span>
                  </div>
                )}
                {fitrahReceipt.infaqAmount > 0 && (
                  <div className="flex justify-between pb-1">
                    <span className="flex items-center gap-1.5 text-amber-700">✨ Sisa Dijadikan Infaq:</span><span className="text-amber-700 text-sm font-extrabold bg-amber-100 px-2 py-0.5 rounded-md">{formatRupiah(fitrahReceipt.infaqAmount)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    const waNum = fitrahReceipt.whatsapp?.replace(/^0/, '62') || '';
                    const rincianBeras = fitrahReceipt.jumlahUang > 0 ? formatRupiah(fitrahReceipt.jumlahUang) : `${fitrahReceipt.jumlahBeras} ${fitrahReceipt.isFitrah ? 'Liter' : 'kg'} Beras`;
                    const sisaInfaq = fitrahReceipt.infaqAmount > 0 ? `\nInfaq Kembalian: ${formatRupiah(fitrahReceipt.infaqAmount)}\n` : '';
                    
                    let msg = '';
                    if (fitrahReceipt.isFitrah) {
                      msg = `*KUITANSI ZAKAT FITRAH*\n*LAZIS AL-MADINAH*\n\nBismillah, Alhamdulillah telah diterima pembayaran Zakat Fitrah atas nama *${fitrahReceipt.nama}* beserta tanggungan (Total *${fitrahReceipt.totalJiwa} Jiwa*).\n\nNominal Zakat: ${rincianBeras}${sisaInfaq}\nSemoga Allah Ta'ala menerima amalan Zakat Fitrah keluarga Bapak/Ibu, menjadikannya pembersih jiwa, dan memberikan keberkahan pada harta yang tersisa. Aamiin Ya Rabbal 'Alamin.\n\n_Wassalamu'alaikum Warahmatullahi Wabarakatuh_\n_Amil LAZIS Al-Madinah_`;
                    } else {
                      msg = `*KUITANSI PENERIMAAN ZIS*\n*LAZIS AL-MADINAH*\n\nBismillah, Alhamdulillah telah diterima donasi untuk kategori *${fitrahReceipt.kategori}* atas nama *${fitrahReceipt.nama}*.\n\nNominal Donasi: ${rincianBeras}\n\nSemoga Allah Ta'ala menerima amalan Bapak/Ibu, menjadikannya pembersih jiwa, dan memberikan keberkahan pada harta yang tersisa. Aamiin Ya Rabbal 'Alamin.\n\n_Wassalamu'alaikum Warahmatullahi Wabarakatuh_\n_Amil LAZIS Al-Madinah_`;
                    }
                    
                    const url = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-300 text-white rounded-xl shadow-[0_8px_16px_-4px_rgba(5,150,105,0.4)] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <Send className="w-5 h-5" />
                  Kirim Kuitansi via WhatsApp
                </button>
                <button
                  onClick={() => setFitrahReceipt(null)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Kuitansi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

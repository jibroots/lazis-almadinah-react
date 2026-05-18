import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  Loader2, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Calendar, 
  User, 
  Check, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { Penyaluran, KategoriZIS, UserAmil } from '../types/lazis';

interface PenyaluranViewProps {
  penyaluranList: Penyaluran[];
  kategoriList: KategoriZIS[];
  currentUser: UserAmil | null;
  onAdd: (newData: any) => void;
  onEdit: (id: number, updatedData: any) => void;
  onDelete: (id: number) => void;
  formatRupiah: (num: number) => string;
}

export default function PenyaluranView({
  penyaluranList,
  kategoriList,
  currentUser,
  onAdd,
  onEdit,
  onDelete,
  formatRupiah
}: PenyaluranViewProps) {
  // Navigation State: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Popups visibility states
  const [detailItem, setDetailItem] = useState<Penyaluran | null>(null);
  const [deletingItem, setDeletingItem] = useState<Penyaluran | null>(null);
  const [editingItem, setEditingItem] = useState<Penyaluran | null>(null);

  // Form State
  const [form, setForm] = useState({
    namaMustahik: '',
    kategori: '',
    jenisPenyaluran: 'uang',
    jumlahUang: '',
    jumlahBeras: '',
    keterangan: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpenKategori, setIsOpenKategori] = useState(false);

  // Initialize kategori
  useEffect(() => {
    if (kategoriList.length > 0 && !form.kategori) {
      setForm(prev => ({ ...prev, kategori: kategoriList[0].id }));
    }
  }, [kategoriList]);

  // Reset Form helper
  const resetForm = () => {
    setForm({
      namaMustahik: '',
      kategori: kategoriList[0]?.id || '',
      jenisPenyaluran: 'uang',
      jumlahUang: '',
      jumlahBeras: '',
      keterangan: ''
    });
  };

  // Open Edit Form and populate it
  const handleOpenEdit = (item: Penyaluran) => {
    let jenis = 'uang';
    const uangVal = Number(item.jumlahUang) || 0;
    const berasVal = Number(item.jumlahBeras) || 0;

    if (uangVal > 0 && berasVal > 0) {
      jenis = 'keduanya';
    } else if (berasVal > 0) {
      jenis = 'beras';
    }

    setForm({
      namaMustahik: item.namaMustahik,
      kategori: item.kategoriId,
      jenisPenyaluran: jenis,
      jumlahUang: uangVal > 0 ? String(uangVal) : '',
      jumlahBeras: berasVal > 0 ? String(berasVal) : '',
      keterangan: item.keterangan || ''
    });
    setEditingItem(item);
    setViewMode('edit');
  };

  // Handle Add/Edit Submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaMustahik.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const uangVal = form.jenisPenyaluran === 'beras' ? 0 : Number(form.jumlahUang) || 0;
      const berasVal = form.jenisPenyaluran === 'uang' ? 0 : Number(form.jumlahBeras) || 0;

      const payload = {
        namaMustahik: form.namaMustahik.trim(),
        kategoriId: form.kategori,
        jumlahUang: uangVal,
        jumlahBeras: berasVal,
        keterangan: form.keterangan.trim() || null
      };

      if (editingItem) {
        onEdit(editingItem.id, payload);
      } else {
        onAdd(payload);
      }

      setIsSubmitting(false);
      setViewMode('list');
      setEditingItem(null);
      resetForm();
    }, 600);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    onDelete(deletingItem.id);
    setDeletingItem(null);
  };

  // Filter
  const filtered = penyaluranList.filter(item => {
    const s = searchQuery.toLowerCase();
    return (
      item.namaMustahik.toLowerCase().includes(s) ||
      item.kategoriId.toLowerCase().includes(s)
    );
  });

  // Pagination
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
              <span className="text-2xl text-rose-600">📤</span>
              {viewMode === 'edit' ? 'Ubah Rincian Penyaluran ZIS' : 'Catat Penyaluran ZIS Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {viewMode === 'edit' 
                ? 'Ubah data rincian penyaluran bantuan mustahik secara aman di database' 
                : 'Mencatat penyaluran zakat, infaq, sedekah secara riil kepada dhuafa, asnaf, atau lembaga mitra'}
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
            {/* Input Nama Mustahik */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Penerima (Mustahik / Golongan) *</label>
              <input
                type="text"
                value={form.namaMustahik}
                onChange={(e) => setForm(prev => ({ ...prev, namaMustahik: e.target.value }))}
                placeholder="Masukkan nama penerima, dhuafa, atau asnaf..."
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800"
                required
              />
            </div>

            {/* Kategori Syariat ZIS */}
            <div className="relative max-w-md">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sumber Kas ZIS Syariat</label>
              <button
                type="button"
                onClick={() => setIsOpenKategori(!isOpenKategori)}
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>{kategoriList.find(k => k.id === form.kategori)?.nama || 'Pilih Kategori Syariat ZIS'}</span>
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
                          setForm(prev => ({ ...prev, kategori: k.id }));
                          setIsOpenKategori(false);
                        }}
                        className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                          form.kategori === k.id ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                        }`}
                      >
                        <span>{k.nama}</span>
                        {form.kategori === k.id && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Jenis Penyaluran Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jenis Penyaluran</label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl max-w-md">
                {['uang', 'beras', 'keduanya'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, jenisPenyaluran: type }))}
                    className={`py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                      form.jenisPenyaluran === type
                        ? 'bg-white text-rose-800 shadow-sm border border-rose-100/30'
                        : 'text-slate-500 hover:text-rose-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Uang & Beras Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(form.jenisPenyaluran === 'uang' || form.jenisPenyaluran === 'keduanya') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Nominal Uang Disalurkan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={form.jumlahUang}
                      onChange={(e) => setForm(prev => ({ ...prev, jumlahUang: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-rose-700"
                      required
                    />
                  </div>
                </div>
              )}

              {(form.jenisPenyaluran === 'beras' || form.jenisPenyaluran === 'keduanya') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jumlah Beras Disalurkan (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.jumlahBeras}
                      onChange={(e) => setForm(prev => ({ ...prev, jumlahBeras: e.target.value }))}
                      placeholder="0"
                      className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-amber-800"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Keterangan / Alasan Penyaluran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keterangan / Alasan Penyaluran</label>
              <textarea
                value={form.keterangan}
                onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Tuliskan keterangan penyaluran bantuan (contoh: bantuan konsumsi bulanan dhuafa RT 02)..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none font-medium text-slate-700"
              />
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
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-rose-300" />
                  {viewMode === 'edit' ? 'Simpan Perubahan' : 'Catat Penyaluran Sekarang'}
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
      
      {/* Header bar */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl text-rose-600">📤</span>
            Penyaluran ZIS (Mustahik)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Rekam pembagian donasi, zakat fitrah, dan asnaf masjid</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Penerima..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold text-slate-800"
            />
          </div>

          <button
            onClick={() => {
              resetForm();
              setViewMode('add');
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-700/10 cursor-pointer transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-200" />
            Tambah Penyaluran
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto px-2 pb-2">
        {paginatedData.length === 0 ? (
          <div className="p-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <span className="text-4xl">📭</span>
            Tidak ada laporan penyaluran ZIS ditemukan.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-700 font-extrabold uppercase tracking-wider">
                <th className="p-4 pl-6">Tanggal</th>
                <th className="p-4">Mustahik / Penerima</th>
                <th className="p-4">Sumber Kas ZIS</th>
                <th className="p-4 text-right">Jumlah Saluran</th>
                <th className="p-4 text-center pr-6">Pilihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-700 font-bold whitespace-nowrap">
                    {new Date(item.tanggalPenyaluran).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="font-extrabold text-slate-800">{item.namaMustahik}</div>
                    {item.keterangan && <div className="text-[11px] text-slate-650 font-bold mt-0.5 truncate max-w-[220px]">{item.keterangan}</div>}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 font-extrabold border border-rose-100/40 uppercase tracking-wide text-[10px]">
                      {item.kategoriId}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold">
                    {Number(item.jumlahUang) > 0 && <div className="text-rose-700 font-extrabold">{formatRupiah(item.jumlahUang)}</div>}
                    {Number(item.jumlahBeras) > 0 && <div className="text-amber-800 font-extrabold">🌾 {item.jumlahBeras} kg</div>}
                  </td>
                  <td className="p-4 text-center pr-6 whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
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
                      {currentUser?.role !== 'Amil' && (
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-200/50 bg-rose-50/20"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
        <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-650">
          <div>
            Menampilkan <span className="text-slate-800">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span> sampai{' '}
            <span className="text-slate-800">{Math.min(filtered.length, currentPage * itemsPerPage)}</span> dari{' '}
            <span className="text-slate-800">{filtered.length}</span> data mustahik
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
                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
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
              <div className="text-3xl inline-block p-2.5 bg-white/10 rounded-full border border-white/20">
                🕌
              </div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-rose-300">Laporan Penyaluran Resmi</h3>
              <h2 className="text-lg font-bold text-white leading-5">SIM LAZIS AL-MADINAH</h2>
            </div>

            <div className="p-6 space-y-6 text-slate-750">
              
              <div className="text-center py-3 border-b border-dashed border-slate-200 bg-rose-50/30 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1">TOTAL DANA/BERAS DISALURKAN</span>
                <div className="text-2xl font-extrabold text-rose-700">
                  {Number(detailItem.jumlahUang) > 0 ? formatRupiah(detailItem.jumlahUang) : ''}
                </div>
                {Number(detailItem.jumlahBeras) > 0 && (
                  <div className="text-base font-extrabold text-amber-800 mt-1">🌾 {detailItem.jumlahBeras} kg Beras</div>
                )}
              </div>

              <div className="space-y-4 text-xs font-bold">
                
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0"><User className="w-3.5 h-3.5" /> Mustahik:</span>
                  <span className="font-extrabold text-slate-800 text-right">{detailItem.namaMustahik}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal:</span>
                  <span className="font-extrabold text-slate-800">
                    {new Date(detailItem.tanggalPenyaluran).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">⚖️ Sumber Kas:</span>
                  <span className="font-extrabold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-150 uppercase text-[10px]">
                    {detailItem.kategoriId}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1.5">Keterangan Penyaluran:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                    {detailItem.keterangan || 'Tidak ada keterangan tambahan.'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setDetailItem(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Tutup Rincian
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
              <h3 className="text-base font-extrabold text-slate-800">Hapus Riwayat Penyaluran</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus data penyaluran bantuan kepada{' '}
                <span className="font-bold text-slate-800">{deletingItem.namaMustahik}</span>? Penyaluran akan dihapus secara permanen.
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
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

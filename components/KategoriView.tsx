import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import { KategoriZIS } from '../types/lazis';

interface KategoriViewProps {
  kategoriList: KategoriZIS[];
  onAdd: (newData: any) => Promise<boolean>;
  onEdit: (id: number, updatedData: any) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function KategoriView({
  kategoriList,
  onAdd,
  onEdit,
  onDelete
}: KategoriViewProps) {
  // Navigation State: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Popups visibility states
  const [detailItem, setDetailItem] = useState<KategoriZIS | null>(null);
  const [deletingItem, setDeletingItem] = useState<KategoriZIS | null>(null);
  const [editingItem, setEditingItem] = useState<KategoriZIS | null>(null);

  // Form State
  const [form, setForm] = useState({ nama: '', deskripsi: '' });

  const resetForm = () => {
    setForm({ nama: '', deskripsi: '' });
  };

  const handleOpenEdit = (item: KategoriZIS) => {
    setForm({
      nama: item.nama,
      deskripsi: item.deskripsi
    });
    setEditingItem(item);
    setViewMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    const payload = {
      nama: form.nama.trim(),
      deskripsi: form.deskripsi.trim()
    };

    if (editingItem) {
      await onEdit(Number(editingItem.id), payload);
    } else {
      await onAdd(payload);
    }

    setViewMode('list');
    setEditingItem(null);
    resetForm();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    await onDelete(Number(deletingItem.id));
    setDeletingItem(null);
  };

  // Filter
  const filtered = kategoriList.filter(item => {
    const s = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(s) ||
      item.deskripsi.toLowerCase().includes(s)
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
              <span className="text-2xl">🏷️</span>
              {viewMode === 'edit' ? 'Ubah Rincian Kategori ZIS' : 'Tambah Kategori ZIS Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {viewMode === 'edit' 
                ? 'Ubah parameter dan deskripsi kategori kas syariat ZIS' 
                : 'Buat kategori zakat, infaq, sedekah, fidyah, wakaf baru untuk operasional internal masjid'}
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
              onClick={() => {
                setViewMode('list');
                setEditingItem(null);
                resetForm();
              }}
              className="px-5 py-3 border border-slate-250 hover:bg-slate-55 rounded-xl text-slate-700 transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer font-bold animate-pulseOnce"
            >
              <Check className="w-4 h-4 text-emerald-100" />
              {viewMode === 'edit' ? 'Simpan Perubahan' : 'Buat Kategori Baru'}
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
            <span className="text-2xl">🏷️</span>
            Kategori Kas ZIS Masjid
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Atur dan kelola jenis alokasi zakat, infaq, shodaqoh masjid</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kategori..."
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
            Tambah Kategori
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto px-2 pb-2">
        {paginatedData.length === 0 ? (
          <div className="p-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <span className="text-4xl">📭</span>
            Tidak ada kategori ZIS ditemukan.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-700 font-extrabold uppercase tracking-wider">
                <th className="p-4 pl-6 w-1/4">Nama Kategori</th>
                <th className="p-4 w-1/2">Deskripsi / Peruntukan</th>
                <th className="p-4 text-center pr-6 w-1/4">Pilihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-extrabold text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      {item.nama}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 leading-relaxed font-semibold">
                    <div className="line-clamp-2 max-w-lg">{item.deskripsi || 'Tidak ada deskripsi.'}</div>
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
                      {/* Prevent deleting default system categories for stability */}
                      {['Zakat Fitrah', 'Zakat Maal', 'Infaq', 'Sedekah', 'Fidyah'].indexOf(item.id) === -1 && (
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
        <div className="p-6 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-655">
          <div>
            Menampilkan <span className="text-slate-800">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span> sampai{' '}
            <span className="text-slate-800">{Math.min(filtered.length, currentPage * itemsPerPage)}</span> dari{' '}
            <span className="text-slate-800">{filtered.length}</span> kategori aktif
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
              <div className="text-3xl inline-block p-2.5 bg-white/10 rounded-full border border-white/20">
                🏷️
              </div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-300">Detail Parameter Kas</h3>
              <h2 className="text-lg font-bold text-white leading-5">{detailItem.nama}</h2>
            </div>

            <div className="p-6 space-y-5 text-slate-750 text-xs font-bold">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Identifikasi Sistem:</span>
                <span className="font-mono text-slate-800 block bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl">ID: {detailItem.id}</span>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-2">Peruntukan & Deskripsi:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                  {detailItem.deskripsi || 'Tidak ada deskripsi peruntukan.'}
                </p>
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
              <h3 className="text-base font-extrabold text-slate-800">Hapus Kategori ZIS</h3>
              <p className="text-xs text-slate-505 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-bold text-slate-800">{deletingItem.nama}</span>? Penghapusan ini dapat memengaruhi relasi kas transaksi donasi.
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

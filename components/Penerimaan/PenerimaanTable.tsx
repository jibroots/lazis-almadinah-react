'use client';
import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Loader2, Eye, Edit, Trash2, Send, User } from 'lucide-react';
import { Penerimaan } from '@/types/lazis';

interface Props {
  data: Penerimaan[];
  isLoading: boolean;
  formatRupiah: (num: number) => string;
  onAddNew: () => void;
  onEdit: (item: Penerimaan) => void;
  onDelete: (item: Penerimaan) => void;
  onViewDetail: (item: Penerimaan) => void;
  onSendWA: (item: Penerimaan) => void;
  isGeneratingStruk: boolean;
  generatingItemId: number | null;
}

export default function PenerimaanTable({
  data,
  isLoading,
  formatRupiah,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
  onSendWA,
  isGeneratingStruk,
  generatingItemId
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search
  const filtered = data.filter(item => {
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
  }, [searchQuery, totalPages, currentPage]);

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
      {/* Table Title Bar */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            Penerimaan Kas ZIS (Muzakki)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Kelola riwayat dana masuk serta donasi langsung masjid</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
            onClick={onAddNew}
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
                      day: 'numeric', month: 'short', year: 'numeric'
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
                          onClick={() => onSendWA(item)}
                          disabled={isGeneratingStruk && generatingItemId === item.id}
                          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200/50 bg-emerald-50/20 disabled:opacity-60 disabled:cursor-wait"
                          title={isGeneratingStruk && generatingItemId === item.id ? 'Membuat struk PDF...' : 'Kirim Struk via WA'}
                        >
                          {isGeneratingStruk && generatingItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => onViewDetail(item)} className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200 bg-slate-50" title="Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(item)} className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200/50 bg-emerald-50/20" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item)} className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-200/50 bg-rose-50/20" title="Hapus">
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
                  currentPage === idx + 1 ? 'bg-emerald-900 border-emerald-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
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
    </div>
  );
}
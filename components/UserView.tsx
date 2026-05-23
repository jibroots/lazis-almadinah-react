import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Shield, 
  Lock, 
  Check, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { UserAmil } from '../types/lazis';

interface UserViewProps {
  userList: UserAmil[];
  currentUser: UserAmil | null;
  onAdd: (newData: any) => void;
  onEdit: (id: number, updatedData: any) => void;
  onDelete: (id: number) => void;
}

export default function UserView({
  userList,
  currentUser,
  onAdd,
  onEdit,
  onDelete
}: UserViewProps) {
  // Navigation State: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Popups visibility states
  const [detailItem, setDetailItem] = useState<UserAmil | null>(null);
  const [deletingItem, setDeletingItem] = useState<UserAmil | null>(null);
  const [editingItem, setEditingItem] = useState<UserAmil | null>(null);

  // Form State
  const [form, setForm] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'Amil' as 'Admin' | 'Bendahara' | 'Amil',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  const [isOpenRole, setIsOpenRole] = useState(false);
  const [isOpenStatus, setIsOpenStatus] = useState(false);

  const resetForm = () => {
    setForm({
      nama: '',
      username: '',
      password: '',
      role: 'Amil',
      status: 'Aktif'
    });
  };

  const handleOpenEdit = (item: UserAmil) => {
    // RBAC check: Only admin can edit users
    if (currentUser?.role !== 'Admin') {
      alert('Akses ditolak! Hanya Admin Utama yang diizinkan untuk mengubah profil Amil.');
      return;
    }
    setForm({
      nama: item.nama,
      username: item.username,
      password: item.password || '',
      role: item.role,
      status: item.status
    });
    setEditingItem(item);
    setViewMode('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.username.trim()) return;

    if (currentUser?.role !== 'Admin') {
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      username: form.username.toLowerCase().replace(/\s+/g, ''),
      password: form.password,
      role: form.role,
      status: form.status
    };

    if (editingItem) {
      onEdit(editingItem.id, payload);
    } else {
      onAdd(payload);
    }

    setViewMode('list');
    setEditingItem(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    onDelete(deletingItem.id);
    setDeletingItem(null);
  };

  // Filter
  const filtered = userList.filter(item => {
    const s = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(s) ||
      item.username.toLowerCase().includes(s) ||
      item.role.toLowerCase().includes(s)
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
              <span className="text-2xl">👥</span>
              {viewMode === 'edit' ? 'Ubah Profil Petugas Amil' : 'Daftarkan Petugas Amil Baru'}
            </h2>
            <p className="text-xs text-slate-505 mt-1 font-semibold">
              {viewMode === 'edit' 
                ? 'Perbarui hak akses, nama lengkap, atau status beku login petugas amil masjid' 
                : 'Beri hak akses login platform baru untuk bendahara keuangan maupun petugas lapangan'}
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
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Lengkap Petugas *</label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Masukkan nama lengkap..."
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
                required
              />
            </div>

            {/* Username Login */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Username Akses Login *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Contoh: ahmad.amil"
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-semibold text-slate-805"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {viewMode === 'edit' ? 'Password Sandi Baru (Kosongkan jika tidak diubah)' : 'Password Sandi Masuk *'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder={viewMode === 'edit' ? 'Masukkan password baru jika ingin mengubah password lamanya...' : 'Ketik password untuk akun amil baru...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
                required={viewMode === 'add'}
              />
            </div>

            {/* Role & Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jabatan (Role Peran)</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenRole(!isOpenRole);
                    setIsOpenStatus(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span>{form.role === 'Admin' ? 'Admin (Super Admin)' : form.role === 'Bendahara' ? 'Bendahara (Keuangan)' : 'Amil (Petugas Lapangan)'}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenRole ? 'rotate-180' : ''}`} />
                </button>
                {isOpenRole && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpenRole(false)} />
                    <ul className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-sm font-semibold text-slate-800 animate-scaleUp">
                      {[
                        { value: 'Amil', label: 'Amil (Petugas Lapangan)' },
                        { value: 'Bendahara', label: 'Bendahara (Keuangan)' },
                        { value: 'Admin', label: 'Admin (Super Admin)' }
                      ].map(opt => (
                        <li
                          key={opt.value}
                          onClick={() => {
                            setForm(prev => ({ ...prev, role: opt.value as any }));
                            setIsOpenRole(false);
                          }}
                          className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                            form.role === opt.value ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                          }`}
                        >
                          <span>{opt.label}</span>
                          {form.role === opt.value && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status Akun</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenStatus(!isOpenStatus);
                    setIsOpenRole(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span>{form.status === 'Aktif' ? 'Aktif' : 'Nonaktif / Bekukan Akses'}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenStatus ? 'rotate-180' : ''}`} />
                </button>
                {isOpenStatus && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpenStatus(false)} />
                    <ul className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-sm font-semibold text-slate-800 animate-scaleUp">
                      {[
                        { value: 'Aktif', label: 'Aktif' },
                        { value: 'Nonaktif', label: 'Nonaktif / Bekukan Akses' }
                      ].map(opt => (
                        <li
                          key={opt.value}
                          onClick={() => {
                            setForm(prev => ({ ...prev, status: opt.value as any }));
                            setIsOpenStatus(false);
                          }}
                          className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                            form.status === opt.value ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                          }`}
                        >
                          <span>{opt.label}</span>
                          {form.status === opt.value && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
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
              className="px-6 py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer font-bold"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              {viewMode === 'edit' ? 'Simpan Rincian Profil' : 'Daftarkan Petugas Sekarang'}
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
            <span className="text-2xl">👥</span>
            Daftar Petugas Amil Masjid
          </h2>
          <p className="text-xs text-slate-505 font-semibold mt-1">Pengaturan akses amil, bendahara, dan administrator internal masjid</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Amil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800"
            />
          </div>

          {currentUser?.role === 'Admin' && (
            <button
              onClick={() => {
                resetForm();
                setViewMode('add');
              }}
              className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              Tambah Petugas Amil
            </button>
          )}
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto px-2 pb-2">
        {paginatedData.length === 0 ? (
          <div className="p-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <span className="text-4xl">📭</span>
            Tidak ada data amil ditemukan.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-700 font-extrabold uppercase tracking-wider">
                <th className="p-4 pl-6">Nama Lengkap</th>
                <th className="p-4">Username Login</th>
                <th className="p-4">Jabatan (Role)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center pr-6">Pilihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-extrabold text-slate-800 whitespace-nowrap">{item.nama}</td>
                  <td className="p-4 font-mono text-slate-700 font-bold">{item.username}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                      item.role === 'Admin' 
                        ? 'bg-rose-50 text-rose-800 border-rose-250/20' 
                        : item.role === 'Bendahara'
                        ? 'bg-amber-50 text-amber-800 border-amber-250/20'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-250/20'
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="p-4 font-extrabold">
                    <span className={item.status === 'Aktif' ? 'text-emerald-700' : 'text-slate-500 font-semibold'}>
                      {item.status}
                    </span>
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
                      
                      {currentUser?.role === 'Admin' && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-emerald-200/50 bg-emerald-50/20"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {item.id !== 1 && (
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-200/50 bg-rose-50/20"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
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
            <span className="text-slate-800">{filtered.length}</span> petugas amil
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
              {/*<div className="text-3xl inline-block p-2.5 bg-white/10 rounded-full border border-white/20">
                👥
              </div>*/}
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-350">Profil Pengurus Resmi</h3>
              <h2 className="text-lg font-bold text-white leading-5">{detailItem.nama}</h2>
            </div>

            <div className="p-6 space-y-4 text-slate-750 text-xs font-bold">
              <div className="space-y-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">👤 Nama Lengkap:</span>
                  <span className="font-extrabold text-slate-800">{detailItem.nama}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">🔑 Username Login:</span>
                  <span className="font-mono text-slate-800 font-extrabold bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">{detailItem.username}</span>
                </div>

                {/*{detailItem.password && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5">🔑 Password Sandi:</span>
                    <span className="font-mono font-extrabold bg-amber-50 text-amber-900 px-2.5 py-1.5 rounded-xl border border-amber-250">{detailItem.password}</span>
                  </div>
                )}*/}

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Jabatan:</span>
                  <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-150 uppercase tracking-wider text-[10px]">
                    {detailItem.role}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Hak Akses:</span>
                  <span className="font-extrabold text-slate-800">
                    {detailItem.role === 'Admin' ? 'Master Full Access' : detailItem.role === 'Bendahara' ? 'Keuangan & Laporan' : 'Kasir & Input Lapangan'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">⚙️ Status:</span>
                  <span className={`font-extrabold ${detailItem.status === 'Aktif' ? 'text-emerald-700' : 'text-slate-500 font-semibold'}`}>{detailItem.status}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setDetailItem(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Tutup Profil
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
              <h3 className="text-base font-extrabold text-slate-800">Bekukan Akun Amil</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus/menonaktifkan hak akses login amil{' '}
                <span className="font-bold text-slate-800">{deletingItem.nama}</span>? Petugas ini tidak akan bisa login kembali.
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
                Ya, Bekukan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

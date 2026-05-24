"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Imports types
import { Penerimaan, Penyaluran, UserAmil, KategoriZIS } from '../types/lazis';

// Import views and sub-components
import LoginPortal from '../components/LoginPortal';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import PenerimaanView from '../components/Penerimaan/PenerimaanView';
import PenyaluranView from '../components/Penyaluran/PenyaluranView';
import KategoriView from '../components/Kategori/KategoriView';
import UserView from '../components/UserView';
import MonthlyReport from '@/components/Report/MonthlyReport';

export default function Home() {
  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAmil | null>(null);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'penerimaan' | 'penyaluran' | 'kategori' | 'user' | 'report'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [penerimaanList, setPenerimaanList] = useState<Penerimaan[]>([]);
  const [penyaluranList, setPenyaluranList] = useState<Penyaluran[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriZIS[]>([]);
  const [userList, setUserList] = useState<UserAmil[]>([]);

  // Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ====================================================
  // 1. HELPER NOTIFIKASI (HARUS DI ATAS)
  // ====================================================
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ====================================================
  // 2. DATABASE SYNC & INITIALIZATION
  // ====================================================
  const fetchPenerimaan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/penerimaan');
      if (!response.ok) throw new Error('Gagal memuat data penerimaan');
      const result = await response.json();
      setPenerimaanList(result);
    } catch (error: any) {
      showNotification('error', error.message || 'Terjadi kesalahan sinkronisasi penerimaan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPenyaluran = async () => {
    try {
      const response = await fetch('/api/penyaluran');
      if (!response.ok) throw new Error('Gagal memuat data penyaluran');
      const result = await response.json();
      setPenyaluranList(result);
    } catch (error: any) {
      showNotification('error', error.message || 'Terjadi kesalahan sinkronisasi penyaluran');
    }
  };

  const fetchKategori = async () => {
    try {
      const response = await fetch('/api/kategori');
      if (!response.ok) throw new Error('Gagal memuat data kategori');
      const result = await response.json();
      setKategoriList(result);
    } catch (error: any) {
      showNotification('error', error.message || 'Terjadi kesalahan sinkronisasi kategori');
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Gagal memuat data petugas');
      const result = await response.json();
      setUserList(result);
    } catch (error: any) {
      showNotification('error', error.message || 'Terjadi kesalahan sinkronisasi petugas');
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchPenerimaan(),
      fetchPenyaluran(),
      fetchKategori(),
      fetchUser()
    ]);
    setIsLoading(false);
  };

  const initDatabaseAndLoad = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/init');
      if (!res.ok) throw new Error('Gagal melakukan inisialisasi database');
      const initResult = await res.json();
      
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated) {
          setCurrentUser(authData.user);
          setIsLoggedIn(true);
          // Setelah validasi login, langsung tarik data
          await loadAllData();
        }
      }
      setIsCheckingAuth(false);

      await Promise.all([
        fetchPenerimaan(),
        fetchPenyaluran(),
        fetchKategori(),
        fetchUser()
      ]);

      if (initResult.seededAdmin) {
        console.log('Database seeded: Super Admin created!');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Gagal memuat database cloud');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initDatabaseAndLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleLoginSuccess = async (user: UserAmil) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    showNotification('success', `Selamat Datang, ${user.nama}! Anda masuk sebagai ${user.role}.`);
    setActiveTab('dashboard');
    
    // TARIK DATA BEGITU LOGIN BERHASIL
    await loadAllData(); 
  };
  }, []);

  // ====================================================
  // 3. AUTH & CALCULATIONS
  // ====================================================
  const handleLoginSuccess = (user: UserAmil) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    showNotification('success', `Selamat Datang, ${user.nama}! Anda masuk sebagai ${user.role}.`);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    showNotification('success', 'Anda telah berhasil keluar dari sistem keamanan.');
  };

  const totalPenerimaanUang = penerimaanList.reduce((acc, curr) => acc + (Number(curr.jumlahUang) || 0), 0);
  const totalPenerimaanBeras = penerimaanList.reduce((acc, curr) => acc + (Number(curr.jumlahBeras) || 0), 0);

  const totalPenyaluranUang = penyaluranList.reduce((acc, curr) => acc + (Number(curr.jumlahUang) || 0), 0);
  const totalPenyaluranBeras = penyaluranList.reduce((acc, curr) => acc + (Number(curr.jumlahBeras) || 0), 0);

  const saldoUang = totalPenerimaanUang - totalPenyaluranUang;
  const saldoBeras = totalPenerimaanBeras - totalPenyaluranBeras;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // ====================================================
  // 4. PENERIMAAN CRUD HOOKS
  // ====================================================
  const handleAddPenerimaan = async (newData: any) => {
    try {
      const response = await fetch('/api/penerimaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      showNotification('success', 'Transaksi Penerimaan Berhasil Disimpan!');
      fetchPenerimaan();
      return { success: true, id: result.id, pdfUrl: result.pdfUrl };
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return { success: false, id: null, pdfUrl: null };
    }
  };

  const handleEditPenerimaan = async (updatedData: any) => {
    try {
      const response = await fetch('/api/penerimaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah data');
      }

      showNotification('success', 'Transaksi Penerimaan Berhasil Diperbarui!');
      fetchPenerimaan();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleDeletePenerimaan = async (id: number) => {
    try {
      const response = await fetch(`/api/penerimaan?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus data');
      }

      showNotification('success', 'Transaksi Penerimaan Berhasil Dihapus!');
      fetchPenerimaan();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  // ====================================================
  // 5. PENYALURAN CRUD HOOKS
  // ====================================================
  const handleAddPenyaluran = async (newData: any) => {
    try {
      const response = await fetch('/api/penyaluran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan penyaluran');
      }

      showNotification('success', 'Laporan Penyaluran Berhasil Disimpan!');
      fetchPenyaluran();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleEditPenyaluran = async (id: number, updatedData: any) => {
    try {
      const response = await fetch('/api/penyaluran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah penyaluran');
      }

      showNotification('success', 'Laporan Penyaluran Berhasil Diperbarui!');
      fetchPenyaluran();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleDeletePenyaluran = async (id: number) => {
    if (currentUser?.role === 'Amil') {
      showNotification('error', 'Akses ditolak! Amil tidak memiliki izin menghapus transaksi.');
      return false;
    }
    
    try {
      const response = await fetch(`/api/penyaluran?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus penyaluran');
      }

      showNotification('success', 'Laporan penyaluran berhasil dihapus');
      fetchPenyaluran();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  // ====================================================
  // 6. KATEGORI CRUD HOOKS
  // ====================================================
  const handleAddKategori = async (newData: any) => {
    try {
      const response = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan kategori');
      }

      showNotification('success', 'Kategori ZIS baru berhasil dibuat!');
      fetchKategori();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleEditKategori = async (id: number, updatedData: any) => {
    try {
      const response = await fetch('/api/kategori', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, ...updatedData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah kategori');
      }

      showNotification('success', 'Kategori ZIS berhasil diperbarui!');
      fetchKategori();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleDeleteKategori = async (id: number) => {
    try {
      const response = await fetch(`/api/kategori?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus kategori');
      }

      showNotification('success', 'Kategori ZIS berhasil dihapus');
      fetchKategori();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  // ====================================================
  // 7. USER AMIL CRUD HOOKS
  // ====================================================
  const handleAddUser = async (newData: any) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mendaftarkan petugas');
      }

      showNotification('success', 'Petugas Amil baru berhasil didaftarkan!');
      fetchUser();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleEditUser = async (id: number, updatedData: any) => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah profil petugas');
      }

      showNotification('success', 'Profil Petugas Amil berhasil diperbarui!');
      fetchUser();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === 1) {
      showNotification('error', 'Admin utama tidak boleh dihapus!');
      return false;
    }
    
    try {
      const response = await fetch(`/api/user?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus petugas');
      }

      showNotification('success', 'Petugas amil berhasil dinonaktifkan/dihapus');
      fetchUser();
      return true;
    } catch (error: any) {
      showNotification('error', error.message || 'Sistem bermasalah');
      return false;
    }
  };

  // ====================================================
  // 8. RENDER LOGIC
  // ====================================================
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-emerald-500 font-extrabold tracking-widest text-xs uppercase">Memuat Sesi...</div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginPortal 
        onLoginSuccess={handleLoginSuccess}
        showNotification={showNotification}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden text-slate-800">
      
      {/* Toast Alert popup */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 animate-bounce max-w-md ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white border border-emerald-500' 
            : 'bg-rose-600 text-white border border-rose-500'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-250 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-250 shrink-0" />
          )}
          <div className="font-extrabold text-xs sm:text-sm">{notification.message}</div>
        </div>
      )}

      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <Header 
          activeTab={activeTab}
          setSidebarOpen={setSidebarOpen}
          isLoading={isLoading}
          onRefresh={initDatabaseAndLoad}
        />

        {/* Tab View Router */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                currentUser={currentUser}
                saldoUang={saldoUang}
                totalPenerimaanUang={totalPenerimaanUang}
                totalPenyaluranUang={totalPenyaluranUang}
                saldoBeras={saldoBeras}
                totalPenerimaanBeras={totalPenerimaanBeras}
                totalPenyaluranBeras={totalPenyaluranBeras}
                penerimaanList={penerimaanList}
                penyaluranList={penyaluranList}
                setActiveTab={setActiveTab}
                formatRupiah={formatRupiah}
              />
            )}

            {activeTab === 'penerimaan' && (
              <PenerimaanView 
                penerimaanList={penerimaanList}
                kategoriList={kategoriList}
                currentUser={currentUser}
                isLoading={isLoading}
                onAdd={handleAddPenerimaan}
                onEdit={handleEditPenerimaan}
                onDelete={handleDeletePenerimaan}
                formatRupiah={formatRupiah}
              />
            )}

            {activeTab === 'penyaluran' && (
              <PenyaluranView 
                penyaluranList={penyaluranList}
                kategoriList={kategoriList}
                currentUser={currentUser}
                onAdd={handleAddPenyaluran}
                onEdit={handleEditPenyaluran}
                onDelete={handleDeletePenyaluran}
                formatRupiah={formatRupiah}
              />
            )}

            {/* TAB LAPORAN BARU DITAMBAHKAN DI SINI */}
            {activeTab === 'report' && (
              <MonthlyReport 
                penerimaanData={penerimaanList}
                penyaluranData={penyaluranList}
              />
            )}

            {activeTab === 'kategori' && (
              <KategoriView 
                kategoriList={kategoriList}
                onAdd={handleAddKategori}
                onEdit={handleEditKategori}
                onDelete={handleDeleteKategori}
              />
            )}

            {activeTab === 'user' && (
              <UserView 
                userList={userList}
                currentUser={currentUser}
                onAdd={handleAddUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 bg-white border-t border-slate-200 shrink-0 px-6 flex items-center justify-center text-[10px] text-slate-550 font-bold uppercase tracking-wider">
          @ LAZISWAF Al-Madinah System v1.0 • Internal Pengurus Masjid Al-Madinah • Jakarta
        </footer>

      </div>

    </div>
  );
}
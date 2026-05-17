import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Shield, Loader2, AlertCircle, Info } from 'lucide-react';
import { UserAmil } from '../types/lazis';

interface LoginPortalProps {
  onLoginSuccess: (user: UserAmil) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

export default function LoginPortal({ onLoginSuccess, showNotification }: LoginPortalProps) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Terjadi kesalahan sistem');
      }

      onLoginSuccess(result.user);
      setForm({ username: '', password: '' });
    } catch (error: any) {
      setLoginError(error.message || 'Koneksi ke database cloud bermasalah');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 p-4 relative font-sans overflow-hidden">
      {/* Dynamic blurred radial glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2 animate-fadeIn">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 shadow-inner items-center justify-center text-3xl">
            🕌
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LAZIS Al-Madinah</h1>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Sistem Informasi Pengurus Masjid</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-4.5 h-4.5 text-emerald-400" />
              Portal Keamanan Amil
            </h2>
            <p className="text-xs text-slate-300 font-medium">Masukkan akun internal database Anda</p>
          </div>

          {loginError && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-100 text-xs px-4 py-3.5 rounded-xl flex items-start gap-2.5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Secure super admin information card with extremely high-contrast white text on dark background */}
          <div className="bg-slate-800/95 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs text-slate-100">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Info className="w-4 h-4 shrink-0 text-emerald-400" />
              Akses Super Admin Utama:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-200 font-medium">
              Sistem telah diinisialisasi otomatis ke database cloud Neon PostgreSQL. Silakan gunakan kredensial resmi berikut:
            </p>
            <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-[11px] space-y-1 text-slate-100 font-bold">
              <div>Username: <span className="text-emerald-355">superadmin</span></div>
              <div>Password: <span className="text-amber-455">almadinahadmin2026</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider block">Username Amil</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Contoh: superadmin"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider block">Password Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan sandi..."
                  className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-505 hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Menghubungkan Database...
                </>
              ) : (
                <>
                  <Shield className="w-4.5 h-4.5 text-emerald-200" />
                  Masuk ke Platform LAZIS
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-extrabold tracking-widest flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          PLATFORM RESMI INTERNAL MASJID AL-MADINAH
        </div>
      </div>
    </div>
  );
}

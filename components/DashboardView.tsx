import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Scale 
} from 'lucide-react';
import { UserAmil, Penerimaan, Penyaluran } from '../types/lazis';

interface DashboardViewProps {
  currentUser: UserAmil | null;
  saldoUang: number;
  totalPenerimaanUang: number;
  totalPenyaluranUang: number;
  saldoBeras: number;
  totalPenerimaanBeras: number;
  totalPenyaluranBeras: number;
  penerimaanList: Penerimaan[];
  penyaluranList: Penyaluran[];
  setActiveTab: (tab: 'dashboard' | 'penerimaan' | 'penyaluran' | 'kategori' | 'user') => void;
  formatRupiah: (num: number) => string;
}

export default function DashboardView({
  currentUser,
  saldoUang,
  totalPenerimaanUang,
  totalPenyaluranUang,
  saldoBeras,
  totalPenerimaanBeras,
  totalPenyaluranBeras,
  penerimaanList,
  penyaluranList,
  setActiveTab,
  formatRupiah
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Dashboard Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 uppercase tracking-wider">
            Internal Dashboard Pengurus
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3 text-white">
            Assalamu'alaikum, {currentUser?.nama}!
          </h1>
          <p className="text-emerald-100/80 text-sm sm:text-base mt-2 font-light">
            Selamat datang di Sistem Informasi ZIS Masjid Al-Madinah. Anda login sebagai **{currentUser?.role}**. Pantau masuk dan keluarnya dana serta stok beras secara transparan.
          </p>
        </div>
      </div>

      {/* Balance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Saldo Uang Kas</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(saldoUang)}
            </h3>
            <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Pemasukan: {formatRupiah(totalPenerimaanUang)}
              </span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> Penyaluran: {formatRupiah(totalPenyaluranUang)}
              </span>
            </div>
          </div>
        </div>

        {/* Rice Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Saldo Stok Beras</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="text-lg">🌾</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {saldoBeras} kg
            </h3>
            <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                Masuk: {totalPenerimaanBeras} kg
              </span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                Keluar: {totalPenyaluranBeras} kg
              </span>
            </div>
          </div>
        </div>

        {/* Total Transactions Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Aktivitas Transaksi</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {penerimaanList.length + penyaluranList.length} Total
            </h3>
            <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {penerimaanList.length} Penerimaan
              </span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                {penyaluranList.length} Penyaluran
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Income Receipts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Penerimaan Terkini
            </h3>
            <button onClick={() => setActiveTab('penerimaan')} className="text-xs text-emerald-600 font-bold hover:underline">
              Lihat Semua
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {penerimaanList.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{item.namaMuzakki}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">{item.kategoriId} • {item.metodePembayaran}</div>
                </div>
                <div className="text-right">
                  {Number(item.jumlahUang) > 0 && <div className="font-bold text-emerald-600">{formatRupiah(Number(item.jumlahUang))}</div>}
                  {Number(item.jumlahBeras) > 0 && <div className="font-bold text-amber-700">🌾 {item.jumlahBeras} kg</div>}
                </div>
              </div>
            ))}
            {penerimaanList.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">Tidak ada penerimaan hari ini.</div>
            )}
          </div>
        </div>

        {/* Recent Distributions Outflow */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Penyaluran Terkini
            </h3>
            <button onClick={() => setActiveTab('penyaluran')} className="text-xs text-emerald-600 font-bold hover:underline">
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {penyaluranList.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{item.namaMustahik}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">{item.kategoriId}</div>
                </div>
                <div className="text-right">
                  {Number(item.jumlahUang) > 0 && <div className="font-bold text-rose-600">-{formatRupiah(Number(item.jumlahUang))}</div>}
                  {Number(item.jumlahBeras) > 0 && <div className="font-bold text-rose-600">🌾 -{item.jumlahBeras} kg</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

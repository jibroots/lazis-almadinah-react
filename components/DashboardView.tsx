import React, { useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Scale,
  PieChart,
  BarChart3,
  Heart,
  Users
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

  // Memoized Chart Data untuk Uang
  const chartDataUang = useMemo(() => {
    const groups = penerimaanList.reduce((acc, curr) => {
      const cat = curr.kategoriId.toLowerCase();
      
      // Hitung infaq sisa kembalian dari keterangan (jika ada)
      let embeddedInfaq = 0;
      if (curr.keterangan) {
        const match = curr.keterangan.match(/Termasuk Infaq Rp\.?\s*([\d.]+)/i);
        if (match) {
          embeddedInfaq = Number(match[1].replace(/\./g, '')) || 0;
        }
      }

      let group = 'Lainnya';
      if (cat.includes('fitrah')) group = 'Zakat Fitrah';
      else if (cat.includes('maal') || cat.includes('mal')) group = 'Zakat Maal';
      else if (cat.includes('infaq') || cat.includes('sedekah') || cat.includes('shodaqoh')) group = 'Infaq & Sedekah';
      else if (cat.includes('fidyah')) group = 'Fidyah';
      
      const totalUang = Number(curr.jumlahUang) || 0;
      
      if (embeddedInfaq > 0 && group !== 'Infaq & Sedekah') {
        // Kurangi jumlah dari grup asal (misal Zakat Fitrah) dan pindahkan sisa kembaliannya ke Infaq & Sedekah
        acc[group] = (acc[group] || 0) + (totalUang - embeddedInfaq);
        acc['Infaq & Sedekah'] = (acc['Infaq & Sedekah'] || 0) + embeddedInfaq;
      } else {
        acc[group] = (acc[group] || 0) + totalUang;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    const validTotal = total > 0 ? total : 1; // avoid division by zero
    
    return [
      { label: 'Zakat Fitrah', value: groups['Zakat Fitrah'] || 0, color: 'bg-emerald-500' },
      { label: 'Zakat Maal', value: groups['Zakat Maal'] || 0, color: 'bg-teal-600' },
      { label: 'Infaq & Sedekah', value: groups['Infaq & Sedekah'] || 0, color: 'bg-amber-500' },
      { label: 'Lainnya (Fidyah, dll)', value: (groups['Lainnya'] || 0) + (groups['Fidyah'] || 0), color: 'bg-blue-500' },
    ].filter(item => item.value > 0)
     .sort((a, b) => b.value - a.value)
     .map(item => ({ ...item, percentage: ((item.value / validTotal) * 100).toFixed(1) }));
  }, [penerimaanList]);

  // Memoized Chart Data untuk Beras
  const chartDataBeras = useMemo(() => {
    const groups = penerimaanList.reduce((acc, curr) => {
      const cat = curr.kategoriId.toLowerCase();
      let group = 'Lainnya';
      if (cat.includes('fitrah')) group = 'Zakat Fitrah';
      else if (cat.includes('fidyah')) group = 'Fidyah';
      else if (cat.includes('kifarat') || cat.includes('kafarat')) group = 'Kifarat';
      
      acc[group] = (acc[group] || 0) + Number(curr.jumlahBeras);
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    const validTotal = total > 0 ? total : 1;
    
    return [
      { label: 'Zakat Fitrah', value: groups['Zakat Fitrah'] || 0, color: 'bg-emerald-500' },
      { label: 'Fidyah', value: groups['Fidyah'] || 0, color: 'bg-amber-600' },
      { label: 'Kifarat & Lainnya', value: (groups['Lainnya'] || 0) + (groups['Kifarat'] || 0), color: 'bg-blue-500' },
    ].filter(item => item.value > 0)
     .sort((a, b) => b.value - a.value)
     .map(item => ({ ...item, percentage: ((item.value / validTotal) * 100).toFixed(1) }));
  }, [penerimaanList]);

  // Memoized Stats untuk Infaq & Sedekah (Uang)
  const statsInfaqShodaqoh = useMemo(() => {
    const penerimaan = penerimaanList.reduce((acc, curr) => {
      const cat = curr.kategoriId.toLowerCase();
      // 1. Jika kategori transaksi memang Infaq/Sedekah/Shodaqoh, ambil seluruh jumlahUang
      if (cat.includes('infaq') || cat.includes('sedekah') || cat.includes('shodaqoh')) {
        return acc + (Number(curr.jumlahUang) || 0);
      }
      // 2. Jika kategori lain (seperti Zakat Fitrah), periksa apakah ada infaq sisa kembalian di keterangan
      if (curr.keterangan) {
        const match = curr.keterangan.match(/Termasuk Infaq Rp\.?\s*([\d.]+)/i);
        if (match) {
          const amountStr = match[1].replace(/\./g, '');
          return acc + (Number(amountStr) || 0);
        }
      }
      return acc;
    }, 0);

    const penyaluran = penyaluranList.reduce((acc, curr) => {
      const cat = curr.kategoriId.toLowerCase();
      if (cat.includes('infaq') || cat.includes('sedekah') || cat.includes('shodaqoh')) {
        return acc + (Number(curr.jumlahUang) || 0);
      }
      return acc;
    }, 0);

    return {
      penerimaan,
      penyaluran,
      saldo: penerimaan - penyaluran
    };
  }, [penerimaanList, penyaluranList]);

  // Memoized Chart Data untuk Total Donatur (Jumlah Transaksi per Kategori)
  const chartDataDonatur = useMemo(() => {
    const groups = penerimaanList.reduce((acc, curr) => {
      const cat = curr.kategoriId.toLowerCase();
      let group = 'Lainnya';
      
      if (cat.includes('fitrah')) group = 'Zakat Fitrah';
      else if (cat.includes('maal') || cat.includes('mal')) group = 'Zakat Maal';
      else if (cat.includes('infaq') || cat.includes('sedekah') || cat.includes('shodaqoh')) group = 'Infaq & Sedekah';
      else if (cat.includes('fidyah')) group = 'Fidyah';
      
      acc[group] = (acc[group] || 0) + 1; // Hitung 1 per transaksi/donatur
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    const validTotal = total > 0 ? total : 1;
    
    return [
      { label: 'Zakat Fitrah', value: groups['Zakat Fitrah'] || 0, color: 'bg-emerald-500' },
      { label: 'Zakat Maal', value: groups['Zakat Maal'] || 0, color: 'bg-teal-600' },
      { label: 'Infaq & Sedekah', value: groups['Infaq & Sedekah'] || 0, color: 'bg-amber-500' },
      { label: 'Lainnya (Fidyah, dll)', value: (groups['Lainnya'] || 0) + (groups['Fidyah'] || 0), color: 'bg-blue-500' },
    ].filter(item => item.value > 0)
     .sort((a, b) => b.value - a.value)
     .map(item => ({ ...item, percentage: ((item.value / validTotal) * 100).toFixed(1) }));
  }, [penerimaanList]);


  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Dashboard Banner */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[12px_12px] pointer-events-none"></div>
        <div className="relative z-10 w-full">
          <span className="text-xs font-bold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 uppercase tracking-wider">
            Dashboard Pengurus LAZISWaf Masjid Al-Madinah
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3 text-white">
            Assalamu'alaikum, {currentUser?.nama}!
          </h1>
          <p className="text-emerald-100/80 text-sm sm:text-base mt-2 font-light leading-relaxed">
            Selamat datang di Sistem Informasi LAZISWaf Masjid Al-Madinah. Anda login sebagai <strong className="text-emerald-200 font-bold">{currentUser?.role}</strong>. Pantau arus masuk dan keluarnya dana serta stok beras secara transparan dan real-time.
          </p>
        </div>
      </div>

      {/* Balance Metrics */}{/* Cash Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-content hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Total Hasil Penjualan Beras</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(saldoUang)}
            </h3>
          </div>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Rice Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Total Penerimaan Beras</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="text-lg">🌾</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {saldoBeras} <span className="text-lg text-slate-500 font-bold">Liter</span>
            </h3>
            <div className="flex items-center justify-between gap-3 mt-3 text-[10px] font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded flex items-center gap-0.5">
                Penerimaan: {totalPenerimaanBeras} Liter
              </span>
              <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded flex items-center gap-0.5">
                Penyaluran: {totalPenyaluranBeras} Liter
              </span>
            </div>
          </div>
        </div>
        {/* Infaq & Shodaqoh Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Saldo Infaq & Sedekah</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-650">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(statsInfaqShodaqoh.saldo)}
            </h3>
            <div className="flex items-center justify-between gap-3 mt-3 text-[10px] font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Penerimaan: {formatRupiah(statsInfaqShodaqoh.penerimaan)}
              </span>
              <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> Penyaluran: {formatRupiah(statsInfaqShodaqoh.penyaluran)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
        
        {/* Chart Uang */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Komposisi Penerimaan Uang
            </h3>
          </div>
          
          {chartDataUang.length > 0 ? (
            <div className="space-y-6">
              {/* Stacked Bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex gap-0.5 bg-slate-100 shadow-inner">
                {chartDataUang.map(d => (
                  <div 
                    key={d.label} 
                    style={{ width: `${Math.max(Number(d.percentage), 2)}%` }} 
                    className={`h-full ${d.color} transition-all duration-1000 ease-out`} 
                    title={`${d.label}: ${formatRupiah(d.value)}`} 
                  />
                ))}
              </div>
              
              {/* Legends */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {chartDataUang.map(d => (
                  <div key={d.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
                      <div className={`w-3 h-3 rounded-full ${d.color} shadow-sm`} />
                      {d.label}
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">{formatRupiah(d.value)}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{d.percentage}% dari total</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-xl">
              Belum ada data penerimaan uang.
            </div>
          )}
        </div>

        {/* Chart Beras */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              Komposisi Penerimaan Beras
            </h3>
          </div>

          {chartDataBeras.length > 0 ? (
            <div className="space-y-6">
              {/* Stacked Bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex gap-0.5 bg-slate-100 shadow-inner">
                {chartDataBeras.map(d => (
                  <div 
                    key={d.label} 
                    style={{ width: `${Math.max(Number(d.percentage), 2)}%` }} 
                    className={`h-full ${d.color} transition-all duration-1000 ease-out`} 
                    title={`${d.label}: ${d.value} kg`} 
                  />
                ))}
              </div>
              
              {/* Legends */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {chartDataBeras.map(d => (
                  <div key={d.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
                      <div className={`w-3 h-3 rounded-full ${d.color} shadow-sm`} />
                      {d.label}
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">{d.value} <span className="text-xs text-slate-500">Liter</span></div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{d.percentage}% dari total</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-xl">
              Belum ada data penerimaan beras.
            </div>
          )}
        </div>
{/* Chart Donatur (BARU) */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Total Donatur
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">
              {penerimaanList.length} Total
            </span>
          </div>

          {chartDataDonatur.length > 0 ? (
            <div className="space-y-6">
              {/* Stacked Bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex gap-0.5 bg-slate-100 shadow-inner">
                {chartDataDonatur.map(d => (
                  <div 
                    key={d.label} 
                    style={{ width: `${Math.max(Number(d.percentage), 2)}%` }} 
                    className={`h-full ${d.color} transition-all duration-1000 ease-out`} 
                    title={`${d.label}: ${d.value} Orang`} 
                  />
                ))}
              </div>
              
              {/* Legends */}
              <div className="grid grid-cols-2 gap-4">
                {chartDataDonatur.map(d => (
                  <div key={d.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
                      <div className={`w-3 h-3 rounded-full ${d.color} shadow-sm`} />
                      {d.label}
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">{d.value} <span className="text-xs text-slate-500">Donatur</span></div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{d.percentage}% dari total</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-xl">
              Belum ada data donatur.
            </div>
          )}
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
            <button onClick={() => setActiveTab('penerimaan')} className="text-xs text-emerald-600 font-bold hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Lihat Semua
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {penerimaanList.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors">
                <div>
                  <div className="font-extrabold text-slate-800">{item.namaMuzakki}</div>
                  <div className="text-[11px] text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.kategoriId}</span> 
                    <span>•</span> 
                    <span>{item.metodePembayaran}</span>
                  </div>
                </div>
                <div className="text-right">
                  {Number(item.jumlahUang) > 0 && <div className="font-extrabold text-emerald-600">{formatRupiah(Number(item.jumlahUang))}</div>}
                  {Number(item.jumlahBeras) > 0 && <div className="font-extrabold text-amber-700 mt-0.5">🌾 {item.jumlahBeras} Liter</div>}
                </div>
              </div>
            ))}
            {penerimaanList.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">Tidak ada penerimaan hari ini.</div>
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
            <button onClick={() => setActiveTab('penyaluran')} className="text-xs text-emerald-600 font-bold hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {penyaluranList.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors">
                <div>
                  <div className="font-extrabold text-slate-800">{item.namaMustahik}</div>
                  <div className="text-[11px] text-slate-500 font-bold mt-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.kategoriId}</span>
                  </div>
                </div>
                <div className="text-right">
                  {Number(item.jumlahUang) > 0 && <div className="font-extrabold text-rose-600">-{formatRupiah(Number(item.jumlahUang))}</div>}
                  {Number(item.jumlahBeras) > 0 && <div className="font-extrabold text-rose-600 mt-0.5">🌾 -{item.jumlahBeras} Liter</div>}
                </div>
              </div>
            ))}
            {penyaluranList.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">Tidak ada penyaluran hari ini.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

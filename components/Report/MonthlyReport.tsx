'use client';
import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Wallet, Printer, ChevronDown, Check } from 'lucide-react';
import { Penerimaan, Penyaluran } from '@/types/lazis'; // Sesuaikan path ini jika berbeda

interface MonthlyReportProps {
  penerimaanData: Penerimaan[];
  penyaluranData: Penyaluran[];
}

export default function MonthlyReport({ penerimaanData, penyaluranData }: MonthlyReportProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [isOpenMonth, setIsOpenMonth] = useState(false);
  const [isOpenYear, setIsOpenYear] = useState(false);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Ekstrak daftar tahun unik dari data yang ada
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    penerimaanData.forEach(p => years.add(new Date(p.tanggalPenerimaan).getFullYear()));
    penyaluranData.forEach(p => years.add(new Date(p.tanggalPenyaluran).getFullYear()));
    years.add(currentDate.getFullYear()); // Pastikan tahun ini selalu ada
    return Array.from(years).sort((a, b) => b - a);
  }, [penerimaanData, penyaluranData]);

  // Proses filter dan kalkulasi data berdasarkan bulan & tahun terpilih
  const reportData = useMemo(() => {
    // 1. Filter Data
    const filteredPenerimaan = penerimaanData.filter(item => {
      const date = new Date(item.tanggalPenerimaan);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const filteredPenyaluran = penyaluranData.filter(item => {
      const date = new Date(item.tanggalPenyaluran);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    // 2. Kalkulasi Total Penerimaan
    const totalPenerimaanUang = filteredPenerimaan.reduce((sum, item) => sum + (Number(item.jumlahUang) || 0), 0);
    const totalPenerimaanBeras = filteredPenerimaan.reduce((sum, item) => sum + (Number(item.jumlahBeras) || 0), 0);

    // 3. Kalkulasi Total Penyaluran
    const totalPenyaluranUang = filteredPenyaluran.reduce((sum, item) => sum + (Number(item.jumlahUang) || 0), 0);
    const totalPenyaluranBeras = filteredPenyaluran.reduce((sum, item) => sum + (Number(item.jumlahBeras) || 0), 0);

    // 4. Kalkulasi Saldo Bersih Bulan Ini
    const saldoUang = totalPenerimaanUang - totalPenyaluranUang;
    const saldoBeras = totalPenerimaanBeras - totalPenyaluranBeras;

    return {
      totalPenerimaanUang, totalPenerimaanBeras,
      totalPenyaluranUang, totalPenyaluranBeras,
      saldoUang, saldoBeras,
      jmlTransaksiMasuk: filteredPenerimaan.length,
      jmlTransaksiKeluar: filteredPenyaluran.length
    };
  }, [penerimaanData, penyaluranData, selectedMonth, selectedYear]);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER & FILTER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Laporan Bulanan ZIS
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Rekapitulasi total penerimaan dan penyaluran</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* Custom Dropdown Bulan */}
          <div className="relative w-full md:w-40">
            <button
              type="button"
              onClick={() => { setIsOpenMonth(!isOpenMonth); setIsOpenYear(false); }}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-bold text-slate-700 flex items-center justify-between shadow-sm"
            >
              <span>{months[selectedMonth]}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenMonth ? 'rotate-180' : ''}`} />
            </button>
            {isOpenMonth && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenMonth(false)} />
                <ul className="absolute right-0 md:left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-sm font-semibold text-slate-800 min-w-full w-max animate-scaleUp">
                  {months.map((m, i) => (
                    <li
                      key={i}
                      onClick={() => { setSelectedMonth(i); setIsOpenMonth(false); }}
                      className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                        selectedMonth === i ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                      }`}
                    >
                      <span>{m}</span>
                      {selectedMonth === i && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Custom Dropdown Tahun */}
          <div className="relative w-full md:w-32">
            <button
              type="button"
              onClick={() => { setIsOpenYear(!isOpenYear); setIsOpenMonth(false); }}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-bold text-slate-700 flex items-center justify-between shadow-sm"
            >
              <span>{selectedYear}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpenYear ? 'rotate-180' : ''}`} />
            </button>
            {isOpenYear && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenYear(false)} />
                <ul className="absolute right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-sm font-semibold text-slate-800 min-w-full w-max animate-scaleUp">
                  {availableYears.map(y => (
                    <li
                      key={y}
                      onClick={() => { setSelectedYear(y); setIsOpenYear(false); }}
                      className={`px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex items-center justify-between transition-colors ${
                        selectedYear === y ? 'bg-emerald-50 text-emerald-800 font-extrabold' : ''
                      }`}
                    >
                      <span>{y}</span>
                      {selectedYear === y && <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Penerimaan */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Penerimaan</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-700">{formatRp(reportData.totalPenerimaanUang)}</div>
            <div className="text-sm font-bold text-amber-700">{reportData.totalPenerimaanBeras} Liter Beras</div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400">{reportData.jmlTransaksiMasuk} transaksi masuk</div>
        </div>

        {/* Card Penyaluran */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Penyaluran</h3>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-700">{formatRp(reportData.totalPenyaluranUang)}</div>
            <div className="text-sm font-bold text-amber-700">{reportData.totalPenyaluranBeras} Liter Beras</div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400">{reportData.jmlTransaksiKeluar} transaksi keluar</div>
        </div>

        {/* Card Saldo Bersih */}
        <div className="bg-emerald-900 p-6 rounded-3xl shadow-md border border-emerald-800 text-white relative overflow-hidden">
          <Wallet className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-emerald-800/50" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-emerald-200 uppercase tracking-wider mb-4">Saldo Bersih Bulan Ini</h3>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-white">{formatRp(reportData.saldoUang)}</div>
              <div className="text-sm font-bold text-emerald-300">{reportData.saldoBeras} Liter Beras</div>
            </div>
            <div className="mt-4 text-xs font-medium text-emerald-400/80">
              *Selisih masuk & keluar pada bulan terpilih
            </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION BUTTON */}
      <div className="flex justify-end">
        <button 
          onClick={() => alert('Fitur Cetak PDF sedang disiapkan!')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md flex items-center gap-2 font-bold text-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          Cetak Rekap (PDF)
        </button>
      </div>
    </div>
  );
}
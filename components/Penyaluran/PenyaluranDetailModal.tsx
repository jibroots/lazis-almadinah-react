'use client';
import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Penyaluran } from '@/types/lazis';

interface Props {
  item: Penyaluran | null;
  onClose: () => void;
  formatRupiah: (num: number) => string;
}

export default function PenyaluranDetailModal({ item, onClose, formatRupiah }: Props) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scaleUp">
        
        <div className="bg-emerald-600 text-white px-6 py-6 text-center space-y-2 relative">
          <button 
            onClick={onClose} 
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
              {Number(item.jumlahUang) > 0 ? formatRupiah(Number(item.jumlahUang)) : ''}
            </div>
            {Number(item.jumlahBeras) > 0 && (
              <div className="text-base font-extrabold text-amber-800 mt-1">🌾 {item.jumlahBeras} kg Beras</div>
            )}
          </div>

          <div className="space-y-4 text-xs font-bold">
            <div className="flex justify-between items-start gap-4">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0"><User className="w-3.5 h-3.5" /> Mustahik:</span>
              <span className="font-extrabold text-slate-800 text-right">{item.namaMustahik}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal:</span>
              <span className="font-extrabold text-slate-800">
                {new Date(item.tanggalPenyaluran).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">⚖️ Sumber Kas:</span>
              <span className="font-extrabold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-150 uppercase text-[10px]">
                {item.kategoriId}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1.5">Keterangan Penyaluran:</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                {item.keterangan || 'Tidak ada keterangan tambahan.'}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-slate-200"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
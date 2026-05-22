'use client';
import React from 'react';
import { X } from 'lucide-react';
import { KategoriZIS } from '@/types/lazis';

interface Props {
  item: KategoriZIS | null;
  onClose: () => void;
}

export default function KategoriDetailModal({ item, onClose }: Props) {
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
            🏷️
          </div>
          <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-300">Detail Parameter Kas</h3>
          <h2 className="text-lg font-bold text-white leading-5">{item.nama}</h2>
        </div>

        <div className="p-6 space-y-5 text-slate-750 text-xs font-bold">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Identifikasi Sistem:</span>
            <span className="font-mono text-slate-800 block bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl">ID: {item.id}</span>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-2">Peruntukan & Deskripsi:</span>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
              {item.deskripsi || 'Tidak ada deskripsi peruntukan.'}
            </p>
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
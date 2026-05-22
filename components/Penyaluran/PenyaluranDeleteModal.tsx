'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Penyaluran } from '@/types/lazis';

interface Props {
  item: Penyaluran | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PenyaluranDeleteModal({ item, onClose, onConfirm }: Props) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scaleUp p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-2xl mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-slate-800">Hapus Riwayat Penyaluran</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Apakah Anda yakin ingin menghapus data penyaluran bantuan kepada{' '}
            <span className="font-bold text-slate-800">{item.namaMustahik}</span>? Penyaluran akan dihapus secara permanen.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3 font-bold text-xs">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-700 cursor-pointer transition-all"
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer transition-all"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { X, Download, MessageCircle, FileText } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  dataMuzakki: any; // Data transaksi penerimaan terakhir yang baru saja di-submit
}

export default function ReceiptModal({ isOpen, onClose, receiptUrl, dataMuzakki }: ReceiptModalProps) {
  if (!isOpen || !dataMuzakki) return null;

  // Fungsi untuk mengirim pesan WA otomatis
  const handleKirimWA = () => {
    if (!dataMuzakki.nomorHp || !receiptUrl) {
      alert('Nomor HP tidak tersedia atau struk gagal dimuat.');
      return;
    }

    // Format nomor HP (Ubah awalan 0 menjadi 62, bersihkan spasi/strip)
    let nomorHp = dataMuzakki.nomorHp.replace(/\D/g, ''); 
    if (nomorHp.startsWith('0')) {
      nomorHp = '62' + nomorHp.substring(1);
    }

    const pesan = `Assalamu'alaikum Bapak/Ibu ${dataMuzakki.namaMuzakki},%0A%0A` +
                  `Terima kasih, donasi ZIS Anda telah kami terima.%0A` +
                  `Berikut adalah tautan untuk melihat dan menyimpan struk bukti penerimaan resmi Anda:%0A` +
                  `${receiptUrl}%0A%0A` +
                  `Semoga Allah SWT memberkahi harta Anda dan keluarga. Jazaakumullahu khairan.`;

    // Buka tab baru menuju WhatsApp API
    window.open(`https://wa.me/${nomorHp}?text=${pesan}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scaleUp">
        
        {/* Header Modal */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2 text-sm">
            <FileText className="w-5 h-5 text-emerald-200" /> Struk Berhasil Dibuat
          </h3>
          <button onClick={onClose} className="text-emerald-100 hover:text-white cursor-pointer transition-colors p-1 rounded-lg hover:bg-emerald-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 border-4 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <FileText className="w-7 h-7" />
          </div>
          
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Struk untuk donatur</p>
            <p className="text-xl font-extrabold text-slate-800">{dataMuzakki.namaMuzakki}</p>
          </div>

          {/* Tombol Aksi */}
          <div className="space-y-3 pt-2">
            {receiptUrl ? (
              <>
                <button
                  onClick={handleKirimWA}
                  disabled={!dataMuzakki.nomorHp}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20b858] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  {dataMuzakki.nomorHp ? 'Kirim via WhatsApp' : 'Nomor WA Kosong'}
                </button>
                
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm"
                >
                  <Download className="w-5 h-5 text-slate-400" />
                  Lihat / Download PDF
                </a>
              </>
            ) : (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 flex items-center justify-center gap-2">
                URL Struk tidak tersedia.
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Kembali ke Daftar
          </button>
        </div>

      </div>
    </div>
  );
}
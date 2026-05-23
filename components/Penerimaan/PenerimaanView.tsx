'use client';
import React, { useState } from 'react';
import { X, AlertCircle, User, Calendar, CreditCard, UserPlus, Loader2, Send } from 'lucide-react';
import PenerimaanTable from './PenerimaanTable';
import PenerimaanForm from './PenerimaanForm';
import { Penerimaan, KategoriZIS, UserAmil } from '@/types/lazis';

// Helper Regex untuk View
const extractFitrahData = (keterangan: string | null, item: Penerimaan) => {
  let baseKet = keterangan || '';
  let anggota: string[] = [];
  let infaq = 0;
  let opsi: 'beli_lokasi' | 'bawa_sendiri' = 'beli_lokasi';

  if (keterangan && keterangan.includes('Zakat Fitrah')) {
    const parts = keterangan.split(' | Zakat Fitrah');
    baseKet = parts[0].trim();
    const fitrahPart = parts[1] || keterangan;

    const anggotaMatch = fitrahPart.match(/\(\+ (.*?)\)/);
    if (anggotaMatch && anggotaMatch[1]) {
      anggota = anggotaMatch[1].split(', ').map(s => s.trim());
    }

    const infaqMatch = fitrahPart.match(/\(Termasuk Infaq Rp (.*?)\)/);
    if (infaqMatch && infaqMatch[1]) {
      infaq = parseInt(infaqMatch[1].replace(/\./g, ''), 10);
    }
  }

  if (Number(item.jumlahUang) === 0 && Number(item.jumlahBeras) > 0 && infaq === 0) {
    opsi = 'bawa_sendiri';
  }

  return { baseKet, anggota, infaq, opsi };
};

interface Props {
  penerimaanList: Penerimaan[];
  kategoriList: KategoriZIS[];
  currentUser: UserAmil | null;
  isLoading: boolean;
  // UPDATE: Menyesuaikan tipe balikan agar mengenali pdfUrl dari Supabase
  onAdd: (newData: any) => Promise<{ success: boolean; id: number | null; pdfUrl: string | null }>;
  onEdit: (updatedData: any) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  formatRupiah: (num: number) => string;
}

export default function PenerimaanView({
  penerimaanList,
  kategoriList,
  currentUser,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  formatRupiah
}: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<Penerimaan | null>(null);

  // Modals Visibility States
  const [detailItem, setDetailItem] = useState<Penerimaan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Penerimaan | null>(null);
  const [fitrahReceipt, setFitrahReceipt] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WA Struk States
  const [isGeneratingStruk, setIsGeneratingStruk] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<number | null>(null);

  const handleSaveForm = async (payload: any, receiptData: any, isEdit: boolean) => {
    if (isEdit && editingItem) {
      const success = await onEdit({ ...payload, id: editingItem.id });
      if (success) {
        setViewMode('list');
        setEditingItem(null);
      }
      return { success: !!success, id: editingItem.id, pdfUrl: null };
    } else {
      const result: any = await onAdd(payload); 
      
      if (result.success) {
        setViewMode('list');
        // KUNCI UTAMA: Gabungkan receiptData dengan pdfUrl dari Supabase
        setFitrahReceipt({ ...receiptData, pdfUrl: result.pdfUrl }); 
      }
      return result; 
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    const success = await onDelete(deletingItem.id);
    setIsSubmitting(false);
    if (success) {
      setDeletingItem(null);
    }
  };

  const handleSendWA = (item: Penerimaan) => {
    if (!item.nomorHp) {
      alert('Nomor WhatsApp tidak tersedia untuk donatur ini.');
      return;
    }

    const waNumber = item.nomorHp.replace(/\D/g, '').replace(/^0/, '62');
    const totalRp = Number(item.jumlahUang) || 0;
    const totalKg = Number(item.jumlahBeras) || 0;

    const nominalText = [
      totalRp > 0 ? `*Rp ${new Intl.NumberFormat('id-ID').format(totalRp)}*` : '',
      totalKg > 0 ? `*Beras ${totalKg} kg/Liter*` : '',
    ].filter(Boolean).join(' dan ');

    // CATATAN: Untuk tombol "Kirim WA" yang ada di dalam tabel (data lama),
    // kita tetap menggunakan API lokal sebagai fallback karena data lama belum punya link Supabase.
    const supabaseBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const pdfUrl = supabaseBaseUrl 
      ? `${supabaseBaseUrl}/storage/v1/object/public/struk-penerimaan/struk-${item.id}.pdf`
      : `${window.location.origin}/api/cetak-struk/${item.id}`; // Fallback aman

    const text = `Assalamu'alaikum Wr. Wb.\n\n🕌 *LAZIS AL-MADINAH*\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${item.namaMuzakki}* sejumlah ${nominalText} untuk kategori *${item.kategoriId}*.\n\n📄 *Kuitansi Digital Resmi dapat dilihat dan diunduh pada tautan berikut:*\n${pdfUrl}\n\nSilakan klik tautan di atas untuk melihat kuitansi. Anda dapat menyimpan kuitansi tersebut ke perangkat Anda dengan mengeklik ikon *Download* atau menu *Simpan* di browser Anda.\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga. Aamiin Ya Rabbal 'Alamin.\n\n_Wassalamu'alaikum Wr. Wb._\n_Amil LAZIS Al-Madinah_`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="animate-fadeIn relative">
        <PenerimaanForm
          initialData={editingItem}
          kategoriList={kategoriList}
          currentUser={currentUser}
          onCancel={() => {
            setViewMode('list');
            setEditingItem(null);
          }}
          onSave={handleSaveForm}
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn relative">
      <PenerimaanTable
        data={penerimaanList}
        isLoading={isLoading}
        formatRupiah={formatRupiah}
        onAddNew={() => setViewMode('add')}
        onEdit={(item) => {
          setEditingItem(item);
          setViewMode('edit');
        }}
        onDelete={(item) => setDeletingItem(item)}
        onViewDetail={(item) => setDetailItem(item)}
        onSendWA={handleSendWA}
        isGeneratingStruk={isGeneratingStruk}
        generatingItemId={generatingItemId}
      />

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
              <div className="text-3xl inline-block p-2.5 bg-white/10 rounded-full border border-white/20">🕌</div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-300">Detail Arsip Penerimaan</h3>
              <h2 className="text-lg font-bold text-white leading-5">SIM LAZIS AL-MADINAH</h2>
            </div>

            <div className="p-6 space-y-6 text-slate-750">
              {detailItem.kategoriId.toLowerCase().includes('fitrah') ? (
                (() => {
                  const { baseKet, anggota, infaq } = extractFitrahData(detailItem.keterangan, detailItem);
                  const totalJiwa = 1 + anggota.length;
                  return (
                    <div className="space-y-4 text-xs font-bold bg-slate-50 p-5 rounded-2xl border border-slate-150">
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4" />Donatur Utama:</span>
                        <span className="text-slate-800 text-sm font-extrabold">{detailItem.namaMuzakki}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Tanggungan Zakat:</span>
                        <div className="text-right">
                          <span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md block">{totalJiwa} Jiwa</span>
                          {anggota.length > 0 && <span className="text-[10px] text-slate-500 mt-1 block">({anggota.join(', ')})</span>}
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 flex items-center gap-1.5">🌾 Zakat Beras:</span>
                        <span className="text-amber-700 text-sm font-extrabold">{detailItem.jumlahBeras} Liter</span>
                      </div>
                      {Number(detailItem.jumlahUang) > 0 && (
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                          <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="w-4 h-4" />Nilai Zakat Uang:</span>
                          <span className="text-slate-800 text-sm font-extrabold">{formatRupiah(Number(detailItem.jumlahUang))}</span>
                        </div>
                      )}
                      {infaq > 0 && (
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                          <span className="flex items-center gap-1.5 text-amber-700">✨ Infaq Tambahan:</span>
                          <span className="text-amber-700 text-sm font-extrabold bg-amber-100 px-2 py-0.5 rounded-md">{formatRupiah(infaq)}</span>
                        </div>
                      )}
                      {baseKet && (
                         <div className="pt-2 text-[11px] text-slate-500">
                           <span className="block uppercase tracking-wider mb-1">Catatan:</span>
                           {baseKet}
                         </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200 mb-4">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5 text-xs"><User className="w-4 h-4" /> Donatur:</span>
                    <span className="text-slate-800 font-extrabold text-sm">{detailItem.namaMuzakki}</span>
                  </div>
                  <div className="text-center py-3 border-b border-slate-200 bg-emerald-50/100 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1">TOTAL DONASI DITERIMA</span>
                    <div className="text-2xl font-extrabold text-emerald-700">
                      {Number(detailItem.jumlahUang) > 0 ? formatRupiah(Number(detailItem.jumlahUang)) : ''}
                    </div>
                    {Number(detailItem.jumlahBeras) > 0 && (
                      <div className="text-base font-extrabold text-amber-800 mt-1">🌾 {detailItem.jumlahBeras} kg Beras</div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1.5">Catatan Keterangan:</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                      {detailItem.keterangan || 'Tidak ada keterangan tambahan.'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-4 text-xs font-bold pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal:</span>
                  <span className="font-extrabold text-slate-800">
                    {new Date(detailItem.tanggalPenerimaan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {!detailItem.kategoriId.toLowerCase().includes('fitrah') && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5">⚖️ Kategori:</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-150 uppercase text-[10px]">{detailItem.kategoriId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Pembayaran:</span>
                  <span className="font-extrabold text-slate-800">{detailItem.metodePembayaran} via {detailItem.amilPenerima || 'Sistem'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={() => setDetailItem(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-slate-200">
                  Tutup Arsip
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
              <h3 className="text-base font-extrabold text-slate-800">Hapus Transaksi Penerimaan</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus data penerimaan ZIS dari{' '}
                <span className="font-bold text-slate-800">{deletingItem.namaMuzakki}</span>? Data akan terhapus permanen dari server database cloud.
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
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL KUITANSI DIGITAL (UNIVERSAL: FITRAH & NORMAL)
          ==================================================== */}
      {fitrahReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 animate-scaleUp">
            
            <div className="bg-emerald-700 text-white px-6 py-6 text-center space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
              <button onClick={() => setFitrahReceipt(null)} className="absolute right-4 top-4 text-white/80 hover:text-white cursor-pointer p-1 z-10 bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <div className="text-4xl inline-block p-4 bg-white/10 rounded-full border border-white/20 relative z-10 shadow-lg">🧾</div>
              <h3 className="font-extrabold uppercase tracking-widest text-xs text-emerald-200 relative z-10 mt-3">KUITANSI DIGITAL BERHASIL</h3>
              <h2 className="text-xl font-bold text-white relative z-10">
                {fitrahReceipt.isFitrah ? 'Zakat Fitrah Diterima' : 'Penerimaan Donasi Diterima'}
              </h2>
            </div>

            <div className="p-6 space-y-6 text-slate-750">
              <div className="space-y-4 text-xs font-bold bg-slate-50 p-5 rounded-2xl border border-slate-150">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                  <span className="text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4" />Donatur Utama:</span><span className="text-slate-800 text-sm font-extrabold">{fitrahReceipt.nama}</span>
                </div>
                
                {fitrahReceipt.isFitrah ? (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Total Tanggungan Zakat:</span><span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">{fitrahReceipt.totalJiwa} Jiwa</span>
                  </div>
                ) : (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5">⚖️ Kategori Donasi:</span><span className="text-emerald-700 text-sm font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md uppercase">{fitrahReceipt.kategori}</span>
                  </div>
                )}

                {fitrahReceipt.jumlahUang > 0 && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="w-4 h-4" />Nilai Donasi Uang:</span><span className="text-slate-800 text-sm font-extrabold">{formatRupiah(fitrahReceipt.jumlahUang)}</span>
                  </div>
                )}
                {fitrahReceipt.jumlahBeras > 0 && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                    <span className="text-slate-500 flex items-center gap-1.5">🌾 Nilai Donasi Beras:</span><span className="text-amber-700 text-sm font-extrabold">{fitrahReceipt.jumlahBeras} {fitrahReceipt.isFitrah ? 'Liter' : 'kg'}</span>
                  </div>
                )}
                {fitrahReceipt.infaqAmount > 0 && (
                  <div className="flex justify-between pb-1">
                    <span className="flex items-center gap-1.5 text-amber-700">✨ Sisa Dijadikan Infaq:</span><span className="text-amber-700 text-sm font-extrabold bg-amber-100 px-2 py-0.5 rounded-md">{formatRupiah(fitrahReceipt.infaqAmount)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    const waNum = fitrahReceipt.whatsapp?.replace(/^0/, '62') || '';
                    const totalRp = Number(fitrahReceipt.jumlahUang) || 0;
                    const totalKg = Number(fitrahReceipt.jumlahBeras) || 0;

                    const nominalText = [
                      totalRp > 0 ? `*Rp ${new Intl.NumberFormat('id-ID').format(totalRp)}*` : '',
                      totalKg > 0 ? `*Beras ${totalKg} ${fitrahReceipt.isFitrah ? 'Liter' : 'kg'}*` : '',
                    ].filter(Boolean).join(' dan ');
                    
                    // Merakit pesan yang memanggil tautan Supabase
                    const msg = `Assalamu'alaikum Wr. Wb.\n\n🕌 *LAZIS AL-MADINAH*\n\nAlhamdulillah, kami telah menerima titipan ZIS dari Bapak/Ibu *${fitrahReceipt.nama.trim()}* sejumlah ${nominalText} untuk kategori *${fitrahReceipt.kategori}*.\n\n📄 *Kuitansi Digital Resmi:*\n${fitrahReceipt.pdfUrl || 'Tautan PDF sedang disinkronisasi, silakan cek tabel riwayat.'}\n\n💡 *Catatan:* Silakan klik tautan di atas untuk melihat dan menyimpan kuitansi.\n\nSemoga Allah SWT memberkahi Bapak/Ibu dan keluarga. Aamiin Ya Rabbal 'Alamin.\n\n_Wassalamu'alaikum Wr. Wb._\n_Amil LAZIS Al-Madinah_`;
                    
                    const url = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-lg font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <Send className="w-5 h-5" />
                  Kirim Kuitansi via WhatsApp
                </button>
                <button
                  onClick={() => setFitrahReceipt(null)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Kuitansi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
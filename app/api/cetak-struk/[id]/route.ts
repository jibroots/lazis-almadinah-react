import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import prisma from '@/prisma.config'; // Sesuaikan jika lokasi import prisma Anda berbeda (misal: '@/lib/prisma')

// Gunakan GET agar bisa diakses via URL / Link
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    // 1. Ambil data asli dari Database berdasarkan ID
    const data = await (prisma as any).penerimaan.findUnique({
      where: { id: id }
    });

    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    // 2. Buat Dokumen PDF (A5 Landscape)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 420.94]); 
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const primaryColor = rgb(0.02, 0.4, 0.25);
    const textColor = rgb(0.2, 0.2, 0.2);
    const grayColor = rgb(0.5, 0.5, 0.5);

    // Header
    page.drawText('LAZIS AL-MADINAH', { x: 50, y: 370, size: 22, font: fontBold, color: primaryColor });
    page.drawText('KUITANSI PENERIMAAN ZIS', { x: 50, y: 348, size: 14, font: fontBold, color: textColor });
    page.drawLine({ start: { x: 50, y: 335 }, end: { x: 545, y: 335 }, thickness: 1.5, color: primaryColor });

    // Rincian Data
    const startY = 300;
    const refNumber = `ZIS-${data.id}-${new Date(data.tanggalPenerimaan).getTime().toString().slice(-4)}`;
    const formattedDate = new Date(data.tanggalPenerimaan).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const details = [
      { label: 'Nomor Referensi', value: refNumber },
      { label: 'Tanggal Diterima', value: formattedDate },
      { label: 'Telah Terima Dari', value: data.namaMuzakki || 'Hamba Allah' },
      { label: 'Kategori / Sumber', value: data.kategoriId || 'Donasi Umum' },
    ];

    let currentY = startY;
    details.forEach(detail => {
      page.drawText(detail.label, { x: 50, y: currentY, size: 11, font: fontRegular, color: grayColor });
      page.drawText(':', { x: 180, y: currentY, size: 11, font: fontRegular, color: grayColor });
      page.drawText(detail.value, { x: 195, y: currentY, size: 12, font: fontBold, color: textColor });
      currentY -= 25;
    });

    // Nominal Terbilang (Uang / Beras)
    currentY -= 10;
    const isFitrah = (data.kategoriId || '').toLowerCase().includes('fitrah');
    const satuanBeras = isFitrah ? 'Liter' : 'kg';

    const nominalUang = Number(data.jumlahUang) > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(data.jumlahUang))}` : '';
    const nominalBeras = Number(data.jumlahBeras) > 0 ? `${data.jumlahBeras} ${satuanBeras} Beras` : '';
    const nominalText = [nominalUang, nominalBeras].filter(Boolean).join('  +  ');

    page.drawRectangle({
      x: 50, y: currentY - 25, width: 495, height: 45,
      color: rgb(0.95, 0.98, 0.95), borderColor: primaryColor, borderWidth: 1
    });
    page.drawText(`Sebesar :  ${nominalText}`, { x: 65, y: currentY - 7, size: 14, font: fontBold, color: primaryColor });

    // Keterangan Ekstra
    currentY -= 50;
    page.drawText(`Metode Penyetoran : ${data.metodePembayaran || 'Tunai'}`, { x: 50, y: currentY, size: 10, font: fontBold, color: textColor });

    currentY -= 15;
    if (data.keterangan) {
      const shortKet = data.keterangan.length > 90 ? data.keterangan.substring(0, 90) + '...' : data.keterangan;
      page.drawText(`Catatan / Keterangan : ${shortKet}`, { x: 50, y: currentY, size: 10, font: fontRegular, color: grayColor });
    }

    // Footer Tanda Tangan
    currentY -= 35;
    page.drawText('"Semoga Allah memberikan pahala atas apa yang engkau berikan, menjadikannya pembersih', { x: 50, y: currentY, size: 9, font: fontItalic, color: grayColor });
    page.drawText('bagi jiwamu, dan memberikan keberkahan pada harta yang tersisa."', { x: 50, y: currentY - 12, size: 9, font: fontItalic, color: grayColor });

    page.drawText('Amil / Petugas Penerima', { x: 415, y: 110, size: 11, font: fontBold, color: textColor });
    page.drawText(data.amilPenerima || 'Sistem LAZIS', { x: 415, y: 55, size: 11, font: fontRegular, color: textColor });
    page.drawLine({ start: { x: 405, y: 50 }, end: { x: 555, y: 50 }, thickness: 1, color: grayColor });

    const pdfBytes = await pdfDoc.save();

    // 3. Kembalikan PDF (Gunakan 'inline' agar terbuka langsung di HP/Browser, bukan dipaksa download)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Struk-LAZIS-${refNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF link:', error);
    return NextResponse.json({ error: 'Gagal membuat kuitansi PDF.' }, { status: 500 });
  }
}
export const runtime = 'nodejs'; // Wajib untuk pdfkit

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// ─── Setup DB (Neon) ────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Setup Supabase ─────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Zod Validation Schema ──────────────────────────────────────────────────
const penerimaanSchema = z.object({
  nama: z.string().min(1, 'Nama Muzakki/Donatur wajib diisi!'),
  whatsapp: z.string().optional().nullable(),
  kategori: z.string().min(1, 'Kategori ZIS wajib dipilih!'),
  jumlahUang: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()),
  jumlahBeras: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()),
  metode: z.string().min(1, 'Metode pembayaran wajib dipilih!'),
  keterangan: z.string().optional().nullable(),
  amilPenerima: z.string().optional().nullable(),
});

// ─── Helpers PDF ────────────────────────────────────────────────────────────
function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatTanggal(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function generateNoStruk(id: number): string {
  const year = new Date().getFullYear();
  const paddedId = String(id).padStart(4, '0');
  return `STR/LAZIS/${year}/${paddedId}`;
}

// ─── PDF Generator (Thermal Struk) ──────────────────────────────────────────
async function buildReceiptPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PAGE_WIDTH = 226; // Lebar struk thermal
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, 520],
      margin: 0,
      bufferPages: true,
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const uang = Number(data.jumlahUang) || 0;
    const beras = Number(data.jumlahBeras) || 0;
    const MARGIN = 14;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    let y = 0;

    // Header Background
    doc.rect(0, 0, PAGE_WIDTH, 88).fill('#065f46');

    // Logo
    const logoWidth = 80;
    const logoHeight = 30;
    const posX = (PAGE_WIDTH / 2) - (logoWidth / 2);

    try {
      const logoPath = path.join(process.cwd(), 'public', 'Logo-login.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, posX, 12, { width: logoWidth, height: logoHeight });
      } else {
        doc.roundedRect(PAGE_WIDTH / 2 - 18, 10, 36, 36, 8).fill('#ffffff1a');
      } 
    } catch (e) {
      console.warn('Logo gagal dirender:', e);
    }

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#6ee7b7')
       .text('LAZIS AL-MADINAH', MARGIN, 50, { width: CONTENT_WIDTH, align: 'center', characterSpacing: 1.5 });
    doc.font('Helvetica').fontSize(6.5).fillColor('#a7f3d0')
       .text('Lembaga Amil Zakat, Infaq, dan Sedekah', MARGIN, 62, { width: CONTENT_WIDTH, align: 'center' });
    doc.font('Helvetica').fontSize(6).fillColor('#6ee7b7')
       .text('Bukti Penerimaan ZIS Resmi', MARGIN, 74, { width: CONTENT_WIDTH, align: 'center' });

    y = 96;

    // No. Struk
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#374151')
       .text('NO. STRUK', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 11;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46')
       .text(generateNoStruk(data.id), MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 14;

    // Garis
    doc.strokeColor('#d1fae5').dash(3, { space: 3 }).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke().undash();
    y += 10;

    // Tabel Info Transaksi
    const drawRow = (label: string, value: string, valueColor = '#111827') => {
      doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text(label, MARGIN, y, { width: 70, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(7).fillColor(valueColor).text(value, MARGIN + 72, y, { width: CONTENT_WIDTH - 72, align: 'right', lineBreak: false });
      y += 13;
    };

    drawRow('Tanggal', formatTanggal(data.tanggalPenerimaan));
    drawRow('Amil Penerima', data.amilPenerima || 'Sistem');
    drawRow('Metode', data.metodePembayaran || 'Tunai');

    y += 2;
    doc.strokeColor('#d1fae5').dash(3, { space: 3 }).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke().undash();
    y += 10;

    // Muzakki
    doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text('NAMA MUZAKKI / DONATUR', MARGIN, y, { width: CONTENT_WIDTH });
    y += 10;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827').text(data.namaMuzakki, MARGIN, y, { width: CONTENT_WIDTH });
    y += 14;

    if (data.nomorHp) {
      doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text(`WhatsApp: ${data.nomorHp}`, MARGIN, y, { width: CONTENT_WIDTH });
      y += 12;
    }

    y += 2;
    doc.strokeColor('#d1fae5').dash(3, { space: 3 }).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke().undash();
    y += 10;

    // Donasi
    doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text('RINCIAN DONASI', MARGIN, y, { width: CONTENT_WIDTH });
    y += 10;
    drawRow('Kategori ZIS', data.kategoriId.toUpperCase(), '#065f46');

    if (uang > 0) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, 26).fill('#ecfdf5');
      doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text('Jumlah Uang', MARGIN + 6, y + 5, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#065f46').text(formatRupiah(uang), MARGIN + 6, y + 14, { width: CONTENT_WIDTH - 12, align: 'right', lineBreak: false });
      y += 32;
    }

    if (beras > 0) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, 26).fill('#fffbeb');
      doc.font('Helvetica').fontSize(7).fillColor('#92400e').text('Jumlah Beras', MARGIN + 6, y + 5, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#92400e').text(`${beras} kg/Liter`, MARGIN + 6, y + 14, { width: CONTENT_WIDTH - 12, align: 'right', lineBreak: false });
      y += 32;
    }

    y += 4;

    // Keterangan
    if (data.keterangan && data.keterangan.trim()) {
      doc.strokeColor('#d1fae5').dash(3, { space: 3 }).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke().undash();
      y += 10;
      doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text('KETERANGAN', MARGIN, y, { width: CONTENT_WIDTH });
      y += 10;
      doc.font('Helvetica').fontSize(7.5).fillColor('#374151').text(data.keterangan, MARGIN, y, { width: CONTENT_WIDTH, lineBreak: true });
      y += doc.heightOfString(data.keterangan, { width: CONTENT_WIDTH }) + 8;
    }

    y += 4;

    // Footer
    doc.rect(0, y, PAGE_WIDTH, 70).fill('#f9fafb');
    doc.strokeColor('#d1fae5').lineWidth(1).moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 12;
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#065f46').text('Jazaakumullahu Khairan', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 11;
    doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text('Semoga Allah SWT memberkahi Bapak/Ibu', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 10;
    doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text('dan keluarga. Aamiin.', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
    y += 14;
    doc.font('Helvetica').fontSize(6).fillColor('#d1d5db').text('Dicetak otomatis oleh SIM LAZIS Al-Madinah', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    doc.end();
  });
}

// ─── API ROUTES ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await prisma.penerimaan.findMany({ orderBy: { tanggalPenerimaan: 'desc' } });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = penerimaanSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { nama, whatsapp, kategori, jumlahUang, jumlahBeras, metode, keterangan, amilPenerima } = validation.data;

    // 1. Simpan Database
    const dataBaru = await prisma.penerimaan.create({
      data: {
        namaMuzakki: nama,
        nomorHp: whatsapp || null,
        kategoriId: kategori,
        jumlahUang,
        jumlahBeras,
        metodePembayaran: metode,
        keterangan: keterangan || null,
        amilPenerima: amilPenerima || 'Sistem'
      }
    });

    // 2. Generate PDF Thermal
    try {
      const pdfBuffer = await buildReceiptPDF(dataBaru);
      const fileName = `struk-${dataBaru.id}.pdf`; 

      // 3. Upload ke Supabase (Pastikan nama bucket: struk-penerimaan)
      const { error: uploadError } = await supabase.storage
        .from('struk-penerimaan') 
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('struk-penerimaan')
        .getPublicUrl(fileName);

      return NextResponse.json({ 
        success: true, 
        id: dataBaru.id, 
        pdfUrl: publicUrlData.publicUrl 
      }, { status: 201 });

    } catch (pdfError) {
      console.error('Gagal membuat/upload PDF:', pdfError);
      return NextResponse.json({ success: true, id: dataBaru.id, pdfUrl: null }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // ... (Sama seperti PUT sebelumnya, tidak ada perubahan)
  try {
    const body = await request.json();
    const { id, nama, whatsapp, kategori, jumlahUang, jumlahBeras, metode, keterangan, amilPenerima } = body;
    const dataDiubah = await prisma.penerimaan.update({
      where: { id: Number(id) },
      data: { namaMuzakki: nama, nomorHp: whatsapp || null, kategoriId: kategori, jumlahUang: Number(jumlahUang), jumlahBeras: Number(jumlahBeras), metodePembayaran: metode, keterangan: keterangan || null, amilPenerima: amilPenerima || 'Sistem' }
    });
    return NextResponse.json({ success: true, data: dataDiubah });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // ... (Sama seperti DELETE sebelumnya, tidak ada perubahan)
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await prisma.penerimaan.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: 'Terhapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
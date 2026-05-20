export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs'; 

// ─── Types ───────────────────────────────────────────────────────────────────

interface StrukPayload {
  id: number;
  namaMuzakki: string;
  nomorHp: string | null;
  kategoriId: string;
  jumlahUang: number | null;
  jumlahBeras: number | null;
  metodePembayaran: string | null;
  tanggalPenerimaan: string;
  keterangan: string | null;
  amilPenerima: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatTanggal(dateStr: string): string {
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

// ─── PDF Generator ───────────────────────────────────────────────────────────

async function buildReceiptPDF(data: StrukPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Thermal-receipt dimensions: 226pt wide (~80mm), variable height
    const PAGE_WIDTH = 226;
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

    // ── Header Background ───────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 88).fill('#065f46'); // emerald-800

    // Logo LA ZIS AL-MADINAH
    const logoWidth = 80;
    const logoHeight = 30;
    const posX = (PAGE_WIDTH /2) - (logoWidth / 2);

    try {
      const logoPath = path.join(process.cwd(), 'public', 'Logo-login.png');
      if(fs.existsSync(logoPath)) {
      doc.image(logoPath, posX, 12, {
        width: logoWidth,
        height:logoHeight
      });
    } else {
      doc.roundedRect(PAGE_WIDTH / 2- 18, 10, 36,36, 8).fill('#ffffff1a');
    } 
    } catch (e) {
      console.warn('Logo gagal dirender:',e)
    }

    // Institution name
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#6ee7b7') // emerald-300
      .text('LAZIS AL-MADINAH', MARGIN, 50, { width: CONTENT_WIDTH, align: 'center', characterSpacing: 1.5 });

    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#a7f3d0') // emerald-200
      .text('Lembaga Amil Zakat, Infaq, dan Sedekah', MARGIN, 62, { width: CONTENT_WIDTH, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(6)
      .fillColor('#6ee7b7')
      .text('Bukti Penerimaan ZIS Resmi', MARGIN, 74, { width: CONTENT_WIDTH, align: 'center' });

    y = 96;

    // ── No. Struk ───────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#374151')
      .text('NO. STRUK', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    y += 11;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#065f46')
      .text(generateNoStruk(data.id), MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    y += 14;

    // Dashed separator
    doc
      .strokeColor('#d1fae5')
      .dash(3, { space: 3 })
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke()
      .undash();

    y += 10;

    // ── Date & Amil ─────────────────────────────────────────────────────────
    const drawRow = (label: string, value: string, valueColor = '#111827') => {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7280')
        .text(label, MARGIN, y, { width: 70, lineBreak: false });

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(valueColor)
        .text(value, MARGIN + 72, y, { width: CONTENT_WIDTH - 72, align: 'right', lineBreak: false });

      y += 13;
    };

    drawRow('Tanggal', formatTanggal(data.tanggalPenerimaan));
    drawRow('Amil Penerima', data.amilPenerima || 'Sistem');
    drawRow('Metode', data.metodePembayaran || 'Tunai');

    y += 2;
    doc
      .strokeColor('#d1fae5')
      .dash(3, { space: 3 })
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke()
      .undash();
    y += 10;

    // ── Muzakki Info ────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#9ca3af')
      .text('NAMA MUZAKKI / DONATUR', MARGIN, y, { width: CONTENT_WIDTH });

    y += 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#111827')
      .text(data.namaMuzakki, MARGIN, y, { width: CONTENT_WIDTH });

    y += 14;

    if (data.nomorHp) {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7280')
        .text(`WhatsApp: ${data.nomorHp}`, MARGIN, y, { width: CONTENT_WIDTH });
      y += 12;
    }

    y += 2;
    doc
      .strokeColor('#d1fae5')
      .dash(3, { space: 3 })
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke()
      .undash();
    y += 10;

    // ── Donation Details ────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#9ca3af')
      .text('RINCIAN DONASI', MARGIN, y, { width: CONTENT_WIDTH });

    y += 10;
    drawRow('Kategori ZIS', data.kategoriId.toUpperCase(), '#065f46');

    if (uang > 0) {
      // Amount box
      doc.rect(MARGIN, y, CONTENT_WIDTH, 26).fill('#ecfdf5');
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7280')
        .text('Jumlah Uang', MARGIN + 6, y + 5, { lineBreak: false });
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#065f46')
        .text(formatRupiah(uang), MARGIN + 6, y + 14, { width: CONTENT_WIDTH - 12, align: 'right', lineBreak: false });
      y += 32;
    }

    if (beras > 0) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, 26).fill('#fffbeb');
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#92400e')
        .text('Jumlah Beras', MARGIN + 6, y + 5, { lineBreak: false });
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#92400e')
        .text(`${beras} kg`, MARGIN + 6, y + 14, { width: CONTENT_WIDTH - 12, align: 'right', lineBreak: false });
      y += 32;
    }

    y += 4;

    // ── Keterangan ──────────────────────────────────────────────────────────
    if (data.keterangan && data.keterangan.trim()) {
      doc
        .strokeColor('#d1fae5')
        .dash(3, { space: 3 })
        .moveTo(MARGIN, y)
        .lineTo(PAGE_WIDTH - MARGIN, y)
        .stroke()
        .undash();
      y += 10;

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#9ca3af')
        .text('KETERANGAN', MARGIN, y, { width: CONTENT_WIDTH });

      y += 10;
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#374151')
        .text(data.keterangan, MARGIN, y, { width: CONTENT_WIDTH, lineBreak: true });

      y += doc.heightOfString(data.keterangan, { width: CONTENT_WIDTH }) + 8;
    }

    y += 4;

    // ── Footer ──────────────────────────────────────────────────────────────
    doc.rect(0, y, PAGE_WIDTH, 70).fill('#f9fafb');

    doc
      .strokeColor('#d1fae5')
      .lineWidth(1)
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke();

    y += 12;
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#065f46')
      .text('Jazaakumullahu Khairan', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    y += 11;
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#9ca3af')
      .text('Semoga Allah SWT memberkahi Bapak/Ibu', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    y += 10;
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#9ca3af')
      .text('dan keluarga. Aamiin.', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    y += 14;
    doc
      .font('Helvetica')
      .fontSize(6)
      .fillColor('#d1d5db')
      .text('Dicetak otomatis oleh SIM LAZIS Al-Madinah', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

    doc.end();
  });
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: StrukPayload = await req.json();

    // Validate required fields
    if (!body.id || !body.namaMuzakki) {
      return NextResponse.json(
        { error: 'Data tidak lengkap: id dan namaMuzakki wajib diisi.' },
        { status: 400 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await buildReceiptPDF(body);

    // ── Upload to Supabase Storage ─────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase-project')) {
      // Supabase not configured: return PDF directly as download
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="struk-${body.id}.pdf"`,
          'X-Struk-Mode': 'direct-download',
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `struk-${body.id}-${Date.now()}.pdf`;
    const bucketName = 'struk-zakat';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[generate-struk] Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: `Gagal upload ke Supabase: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ error: 'Gagal mendapatkan URL publik Supabase.' }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl, fileName });
  } catch (err: unknown) {
    console.error('[generate-struk] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

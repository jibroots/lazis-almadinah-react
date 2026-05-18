import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { z } from 'zod';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Zod Validation Schema
const penerimaanSchema = z.object({
  nama: z.string().min(1, 'Nama Muzakki/Donatur wajib diisi!'),
  whatsapp: z.string().optional().nullable(),
  kategori: z.string().min(1, 'Kategori ZIS wajib dipilih!'),
  jumlahUang: z.preprocess((val) => Number(val) || 0, z.number().nonnegative('Jumlah uang tidak boleh bernilai negatif!')),
  jumlahBeras: z.preprocess((val) => Number(val) || 0, z.number().nonnegative('Jumlah beras tidak boleh bernilai negatif!')),
  metode: z.string().min(1, 'Metode pembayaran wajib dipilih!'),
  keterangan: z.string().optional().nullable(),
  amilPenerima: z.string().optional().nullable(),
});

// GET: Ambil semua riwayat penerimaan
export async function GET() {
  try {
    const data = await prisma.penerimaan.findMany({
      orderBy: {
        tanggalPenerimaan: 'desc'
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Simpan transaksi baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request schema
    const validation = penerimaanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { nama, whatsapp, kategori, jumlahUang, jumlahBeras, metode, keterangan, amilPenerima } = validation.data;

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

    return NextResponse.json({ success: true, data: dataBaru });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit transaksi penerimaan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi harus disertakan' }, { status: 400 });
    }

    // Validate request schema
    const validation = penerimaanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { nama, whatsapp, kategori, jumlahUang, jumlahBeras, metode, keterangan, amilPenerima } = validation.data;

    const dataDiubah = await prisma.penerimaan.update({
      where: { id: Number(id) },
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

    return NextResponse.json({ success: true, data: dataDiubah });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus transaksi penerimaan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi harus disertakan' }, { status: 400 });
    }

    await prisma.penerimaan.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
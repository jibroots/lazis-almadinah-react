import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Menggunakan koneksi persistensi Prisma dengan Neon Serverless
const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Ambil riwayat penerimaan
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

// Simpan transaksi baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, whatsapp, kategori, jumlahUang, jumlahBeras, metode, keterangan } = body;

    const dataBaru = await prisma.penerimaan.create({
      data: {
        namaMuzakki: nama,
        nomorHp: whatsapp || null,
        kategoriId: kategori,
        jumlahUang: Number(jumlahUang) || 0,
        jumlahBeras: Number(jumlahBeras) || 0,
        metodePembayaran: metode,
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ success: true, data: dataBaru });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
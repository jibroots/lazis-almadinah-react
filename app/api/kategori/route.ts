// Lokasi: app/api/kategori/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// GET: Ambil semua kategori
export async function GET() {
  try {
    const data = await prisma.kategoriZIS.findMany({
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah kategori baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, deskripsi } = body;

    const dataBaru = await prisma.kategoriZIS.create({
      data: {
        nama,
        deskripsi: deskripsi || null
      }
    });

    return NextResponse.json({ success: true, data: dataBaru });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit kategori
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi } = body; // id = nama lama, nama = nama baru

    if (!id) {
      return NextResponse.json({ error: 'ID (Nama lama) kategori harus disertakan' }, { status: 400 });
    }

    const dataDiubah = await prisma.kategoriZIS.update({
      where: { id: Number(id) }, 
      data: {
        nama,
        deskripsi: deskripsi || null
      }
    });

    return NextResponse.json({ success: true, data: dataDiubah });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus kategori
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // id di sini adalah nama kategori yang ingin dihapus

    if (!id) {
      return NextResponse.json({ error: 'ID kategori harus disertakan di URL' }, { status: 400 });
    }

    await prisma.kategoriZIS.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
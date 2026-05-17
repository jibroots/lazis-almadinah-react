import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// GET: Ambil data penyaluran
export async function GET() {
  try {
    const data = await prisma.penyaluran.findMany({
      orderBy: {
        tanggalPenyaluran: 'desc'
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah data penyaluran
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaMustahik, kategoriId, jumlahUang, jumlahBeras, keterangan } = body;

    const dataBaru = await prisma.penyaluran.create({
      data: {
        namaMustahik,
        kategoriId,
        jumlahUang: Number(jumlahUang) || 0,
        jumlahBeras: Number(jumlahBeras) || 0,
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ success: true, data: dataBaru });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit data penyaluran
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, namaMustahik, kategoriId, jumlahUang, jumlahBeras, keterangan } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID penyaluran harus disertakan' }, { status: 400 });
    }

    const dataDiubah = await prisma.penyaluran.update({
      where: { id: Number(id) },
      data: {
        namaMustahik,
        kategoriId,
        jumlahUang: Number(jumlahUang) || 0,
        jumlahBeras: Number(jumlahBeras) || 0,
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ success: true, data: dataDiubah });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus data penyaluran
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID penyaluran harus disertakan' }, { status: 400 });
    }

    await prisma.penyaluran.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Data penyaluran berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

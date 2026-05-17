import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// GET: Ambil daftar Amil
export async function GET() {
  try {
    const data = await prisma.userAmil.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Daftarkan Amil baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, username, password, role, status } = body;

    // Check if username already exists
    const existing = await prisma.userAmil.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan!' }, { status: 400 });
    }

    const dataBaru = await prisma.userAmil.create({
      data: {
        nama,
        username: username.toLowerCase().trim(),
        password: password || 'amilpassword2026',
        role,
        status: status || 'Aktif'
      }
    });

    return NextResponse.json({ success: true, data: dataBaru });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit profil Amil
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, username, password, role, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID amil harus disertakan' }, { status: 400 });
    }

    const updateData: any = {
      nama,
      username: username.toLowerCase().trim(),
      role,
      status
    };

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const dataDiubah = await prisma.userAmil.update({
      where: { id: Number(id) },
      data: updateData
    });

    return NextResponse.json({ success: true, data: dataDiubah });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Amil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID amil harus disertakan' }, { status: 400 });
    }

    if (Number(id) === 1) {
      return NextResponse.json({ error: 'Admin Utama sistem tidak boleh dihapus!' }, { status: 400 });
    }

    await prisma.userAmil.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Petugas amil berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

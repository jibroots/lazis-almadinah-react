import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan Password wajib diisi!' }, { status: 400 });
    }

    const user = await prisma.userAmil.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Username tidak terdaftar!' }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Password salah!' }, { status: 401 });
    }

    if (user.status !== 'Aktif') {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan oleh administrator!' }, { status: 403 });
    }

    // Login successful
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

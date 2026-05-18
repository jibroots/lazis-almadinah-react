import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.userAmil.findUnique({
      where: { id: Number(payload.id) }
    });

    if (!user || user.status !== 'Aktif') {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

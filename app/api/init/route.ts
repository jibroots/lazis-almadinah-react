import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    // 1. Seed Kategori ZIS if none exist
    const totalKategori = await prisma.kategoriZIS.count();
    let seededCategories = 0;
    if (totalKategori === 0) {
      const defaultCategories = [
        { nama: 'Zakat Fitrah', deskripsi: 'Zakat jiwa yang wajib dikeluarkan menjelang hari raya Idul Fitri bagi setiap muslim.' },
        { nama: 'Zakat Maal', deskripsi: 'Zakat atas harta yang telah mencapai nisab dan haul (simpanan, emas, perdagangan).' },
        { nama: 'Infaq', deskripsi: 'Donasi sukarela untuk kepentingan umum/kegiatan masjid Al-Madinah.' },
        { nama: 'Sedekah', deskripsi: 'Pemberian sukarela baik berupa materiil maupun non-materiil kepada yang membutuhkan.' },
        { nama: 'Fidyah', deskripsi: 'Tebusan bagi yang tidak mampu menjalankan ibadah puasa Ramadan karena uzur syar\'i.' }
      ];

      for (const cat of defaultCategories) {
        await prisma.kategoriZIS.create({
          data: cat
        });
      }
      seededCategories = defaultCategories.length;
    }

    // 2. Seed Super Admin if none exist
    const totalUsers = await prisma.userAmil.count();
    let seededAdmin = false;
    if (totalUsers === 0) {
      const { hashPassword } = await import('@/lib/auth');
      const hashedPassword = await hashPassword('almadinahadmin2026');
      await prisma.userAmil.create({
        data: {
          nama: 'Super Admin Masjid',
          username: 'superadmin',
          password: hashedPassword,
          role: 'Admin',
          status: 'Aktif'
        }
      });
      seededAdmin = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Inisialisasi database berhasil!',
      seededCategories,
      seededAdmin
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

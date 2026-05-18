import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function fixAdmin() {
  try {
    const admin = await prisma.userAmil.findUnique({
      where: { username: 'superadmin' }
    });

    if (admin) {
      console.log('Admin found. Current password snippet:', admin.password.substring(0, 15) + '...');
      const isPlain = !admin.password.startsWith('$2'); // bcrypt hashes usually start with $2a$ or $2b$
      
      const newHash = await bcrypt.hash('almadinahadmin2026', 10);
      await prisma.userAmil.update({
        where: { username: 'superadmin' },
        data: { password: newHash }
      });
      console.log('SUCCESS: Admin password has been updated and securely hashed!');
    } else {
      console.log('ERROR: Admin not found in DB!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();

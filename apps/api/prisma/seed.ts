import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userPasswordHash = await bcrypt.hash('Newgen#321', 12);
  const adminPasswordHash = await bcrypt.hash('Oldgen#321', 12);

  const user = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: { passwordHash: userPasswordHash, name: 'User' },
    create: {
      email: 'user@gmail.com',
      passwordHash: userPasswordHash,
      name: 'User',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { passwordHash: adminPasswordHash, name: 'Admin' },
    create: {
      email: 'admin@gmail.com',
      passwordHash: adminPasswordHash,
      name: 'Admin',
    },
  });

  console.log('Seeded users:', { user: user.email, admin: admin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

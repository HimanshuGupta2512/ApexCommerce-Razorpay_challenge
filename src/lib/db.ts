import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In Vercel, the root is read-only. We must copy the DB to the writable /tmp folder.
  const originalDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const tmpDbPath = '/tmp/dev.db';
  
  if (process.env.VERCEL) {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(originalDbPath)) {
        fs.copyFileSync(originalDbPath, tmpDbPath);
      }
    }
    // Point Prisma to the newly created writable database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:/tmp/dev.db',
        },
      },
    });
  } else {
    prisma = new PrismaClient();
  }
} else {
  // Local development logic
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export const db = prisma;
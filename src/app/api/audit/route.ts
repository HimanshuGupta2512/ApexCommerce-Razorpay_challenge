import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

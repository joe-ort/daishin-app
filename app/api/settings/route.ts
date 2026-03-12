import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT key, value FROM settings");
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key as string] = row.value as string;
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await initDb();
  const db = getDb();

  for (const [key, value] of Object.entries(body)) {
    await db.execute({
      sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      args: [key, value as string, value as string],
    });
  }

  return NextResponse.json({ success: true });
}

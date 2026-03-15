import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Public endpoint: returns substitute_available doctors with id, name, token
// Used by respond page for doctor selection dropdown
export async function GET() {
  await initDb();
  const db = getDb();

  const result = await db.execute(
    "SELECT id, name, token FROM doctors WHERE doctor_group = 'substitute_available' AND active = 1 ORDER BY name"
  );

  return NextResponse.json(result.rows);
}

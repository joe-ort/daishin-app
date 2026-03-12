import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  await initDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM doctors ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { name, email, doctor_group } = await req.json();
  await initDb();
  const db = getDb();
  const token = crypto.randomUUID();

  await db.execute({
    sql: 'INSERT INTO doctors (name, email, token, doctor_group) VALUES (?, ?, ?, ?)',
    args: [name, email, token, doctor_group || 'substitute_available'],
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { id, name, email, doctor_group, active } = await req.json();
  await initDb();
  const db = getDb();

  await db.execute({
    sql: 'UPDATE doctors SET name = ?, email = ?, doctor_group = ?, active = ? WHERE id = ?',
    args: [name, email, doctor_group, active, id],
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await initDb();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM doctors WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}

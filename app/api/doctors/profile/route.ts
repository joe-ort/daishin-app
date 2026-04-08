import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// GET: Fetch own profile by token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, name, email, doctor_group FROM doctors WHERE token = ? AND active = 1',
    args: [token],
  });

  const doctor = result.rows[0];
  if (!doctor) {
    return NextResponse.json({ error: '無効なトークンです' }, { status: 404 });
  }

  return NextResponse.json(doctor);
}

// PUT: Update own profile by token
export async function PUT(req: NextRequest) {
  const { token, email, doctor_group } = await req.json();
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  // Verify token
  const result = await db.execute({
    sql: 'SELECT id FROM doctors WHERE token = ? AND active = 1',
    args: [token],
  });
  const doctor = result.rows[0];
  if (!doctor) {
    return NextResponse.json({ error: '無効なトークンです' }, { status: 404 });
  }

  // Check email uniqueness (exclude self)
  if (email) {
    const emailCheck = await db.execute({
      sql: 'SELECT id FROM doctors WHERE email = ? AND id != ?',
      args: [email, doctor.id],
    });
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }
  }

  await db.execute({
    sql: 'UPDATE doctors SET email = ?, doctor_group = ? WHERE id = ?',
    args: [email, doctor_group, doctor.id],
  });

  return NextResponse.json({ success: true });
}

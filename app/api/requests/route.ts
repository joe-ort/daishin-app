import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendRequestNotification } from '@/lib/mail';
import type { Doctor } from '@/lib/types';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  await initDb();
  const db = getDb();

  if (token) {
    const doctorResult = await db.execute({ sql: 'SELECT * FROM doctors WHERE token = ?', args: [token] });
    const doctor = doctorResult.rows[0];
    if (!doctor) {
      return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
    }
    return NextResponse.json({ doctor });
  }

  // Admin: get all requests with requester info
  const result = await db.execute(`
    SELECT r.*, d.name as requester_name, d.email as requester_email
    FROM requests r
    JOIN doctors d ON r.requester_id = d.id
    ORDER BY r.created_at DESC
  `);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { token, request_date, institution, start_time, end_time, work_type, salary, is_department_related, notes } = await req.json();
  await initDb();
  const db = getDb();

  const doctorResult = await db.execute({ sql: 'SELECT * FROM doctors WHERE token = ?', args: [token] });
  const doctor = doctorResult.rows[0];
  if (!doctor) {
    return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
  }

  const result = await db.execute({
    sql: `INSERT INTO requests (requester_id, request_date, institution, start_time, end_time, work_type, salary, is_department_related, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [doctor.id, request_date, institution, start_time, end_time, work_type, salary || '', is_department_related ? 1 : 0, notes || ''],
  });

  // Send email to all substitute_available doctors
  const availableDoctors = await db.execute("SELECT * FROM doctors WHERE doctor_group = 'substitute_available' AND active = 1");
  const emails = (availableDoctors.rows as unknown as Doctor[])
    .filter(d => d.id !== doctor.id)
    .map(d => d.email);

  if (emails.length > 0) {
    try {
      await sendRequestNotification(emails, doctor.name as string, {
        id: Number(result.lastInsertRowid),
        request_date,
        institution,
        start_time,
        end_time,
        work_type,
        salary: salary || '',
        is_department_related: !!is_department_related,
        notes: notes || '',
      });
    } catch (e) {
      console.error('Email send error:', e);
    }
  }

  return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
}

export async function DELETE(req: NextRequest) {
  const { id, token } = await req.json();
  await initDb();
  const db = getDb();

  const request = await db.execute({ sql: 'SELECT * FROM requests WHERE id = ?', args: [id] });
  if (request.rows.length === 0) {
    return NextResponse.json({ error: '依頼が見つかりません' }, { status: 404 });
  }

  // If token is provided, verify that the requester owns this request
  if (token) {
    const doctor = await db.execute({ sql: 'SELECT id FROM doctors WHERE token = ?', args: [token] });
    if (doctor.rows.length === 0 || doctor.rows[0].id !== request.rows[0].requester_id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
  }
  // If no token, it's an admin action (admin pages are already password-protected)

  await db.execute({ sql: 'DELETE FROM responses WHERE request_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM requests WHERE id = ?', args: [id] });

  return NextResponse.json({ success: true });
}

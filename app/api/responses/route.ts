import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendResponseNotification } from '@/lib/mail';
import type { Doctor, SubRequest } from '@/lib/types';

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get('request_id');
  await initDb();
  const db = getDb();

  if (requestId) {
    const result = await db.execute({
      sql: `SELECT res.*, d.name as responder_name, d.email as responder_email
            FROM responses res
            JOIN doctors d ON res.responder_id = d.id
            WHERE res.request_id = ?
            ORDER BY res.created_at DESC`,
      args: [requestId],
    });
    return NextResponse.json(result.rows);
  }

  const result = await db.execute(`
    SELECT res.*, d.name as responder_name, d.email as responder_email,
           r.institution, r.request_date
    FROM responses res
    JOIN doctors d ON res.responder_id = d.id
    JOIN requests r ON res.request_id = r.id
    ORDER BY res.created_at DESC
  `);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { request_id, token, has_experience, questions } = await req.json();
  await initDb();
  const db = getDb();

  // Get responder
  const doctorResult = await db.execute({ sql: 'SELECT * FROM doctors WHERE token = ?', args: [token] });
  const responder = doctorResult.rows[0] as unknown as Doctor;
  if (!responder) {
    return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
  }

  // Get request
  const requestResult = await db.execute({ sql: 'SELECT * FROM requests WHERE id = ?', args: [request_id] });
  const request = requestResult.rows[0] as unknown as SubRequest;
  if (!request) {
    return NextResponse.json({ error: '依頼が見つかりません' }, { status: 404 });
  }

  // Prevent duplicate applications: only accept if still open
  if (request.status !== 'open') {
    return NextResponse.json({ error: 'この依頼は既に応募が確定しています。' }, { status: 409 });
  }

  // Get requester
  const requesterResult = await db.execute({ sql: 'SELECT * FROM doctors WHERE id = ?', args: [request.requester_id] });
  const requester = requesterResult.rows[0] as unknown as Doctor;

  // Save response
  await db.execute({
    sql: 'INSERT INTO responses (request_id, responder_id, has_experience, questions) VALUES (?, ?, ?, ?)',
    args: [request_id, responder.id, has_experience ? 1 : 0, questions || ''],
  });

  // Close the request so it no longer appears on the top page
  await db.execute({
    sql: "UPDATE requests SET status = 'fulfilled' WHERE id = ?",
    args: [request_id],
  });

  // Get admin email
  const adminResult = await db.execute("SELECT value FROM settings WHERE key = 'smtp_user'");
  const adminEmail = adminResult.rows[0]?.value as string | undefined;

  // Send notification to requester and admin
  const notifyEmails = [requester.email];
  if (adminEmail && adminEmail !== requester.email) {
    notifyEmails.push(adminEmail);
  }

  try {
    await sendResponseNotification(
      notifyEmails,
      responder.name,
      responder.email,
      {
        request_date: request.request_date,
        institution: request.institution,
        start_time: request.start_time,
        end_time: request.end_time,
        work_type: request.work_type,
        salary: request.salary,
        is_department_related: !!request.is_department_related,
        notes: request.notes,
      },
      { has_experience: !!has_experience, questions: questions || '' }
    );
  } catch (e) {
    console.error('Email send error:', e);
  }

  return NextResponse.json({ success: true });
}

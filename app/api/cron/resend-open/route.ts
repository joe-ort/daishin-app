import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendRequestNotification } from '@/lib/mail';
import type { Doctor } from '@/lib/types';

// Resend notifications for open (unfilled) requests at specific intervals:
// - 7 days after initial posting
// - 7 days, 5 days, 3 days before the substitute date
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initDb();
  const db = getDb();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Get all open requests that haven't been filled (no responses) and are in the future
  const openRequests = await db.execute({
    sql: `SELECT r.*, d.name as requester_name, d.id as requester_doc_id
          FROM requests r
          JOIN doctors d ON r.requester_id = d.id
          WHERE r.status = 'open' AND r.request_date >= ?
          AND (SELECT COUNT(*) FROM responses res WHERE res.request_id = r.id) = 0`,
    args: [todayStr],
  });

  const results: { request_id: number; reason: string; success: boolean }[] = [];

  for (const request of openRequests.rows) {
    const requestDate = new Date(request.request_date as string);
    const createdDate = new Date(request.created_at as string);

    // Calculate days
    const daysUntilRequest = Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceCreated = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    let shouldResend = false;
    let reason = '';

    // 7 days after initial posting
    if (daysSinceCreated === 7) {
      shouldResend = true;
      reason = '初回依頼から1週間経過';
    }
    // 7 days before substitute date
    if (daysUntilRequest === 7) {
      shouldResend = true;
      reason = '代診日の1週間前';
    }
    // 5 days before substitute date
    if (daysUntilRequest === 5) {
      shouldResend = true;
      reason = '代診日の5日前';
    }
    // 3 days before substitute date
    if (daysUntilRequest === 3) {
      shouldResend = true;
      reason = '代診日の3日前';
    }

    if (!shouldResend) continue;

    // Get substitute_available doctors (excluding the requester)
    const availableDoctors = await db.execute(
      "SELECT * FROM doctors WHERE doctor_group = 'substitute_available' AND active = 1"
    );
    const emails = (availableDoctors.rows as unknown as Doctor[])
      .filter(d => d.id !== request.requester_doc_id)
      .map(d => d.email);

    if (emails.length === 0) continue;

    try {
      await sendRequestNotification(emails, request.requester_name as string, {
        id: request.id as number,
        request_date: request.request_date as string,
        institution: request.institution as string,
        start_time: request.start_time as string,
        end_time: request.end_time as string,
        work_type: request.work_type as string,
        salary: request.salary as string,
        is_department_related: !!(request.is_department_related as number),
        notes: request.notes as string,
      });
      results.push({ request_id: request.id as number, reason, success: true });
    } catch (e) {
      console.error('Resend error:', e);
      results.push({ request_id: request.id as number, reason, success: false });
    }
  }

  return NextResponse.json({ date: todayStr, resent: results });
}

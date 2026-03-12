import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendReminder } from '@/lib/mail';
import type { Doctor } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initDb();
  const db = getDb();

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Find requests for tomorrow that have responses
  const result = await db.execute({
    sql: `SELECT r.*, d.name as requester_name, d.email as requester_email
          FROM requests r
          JOIN doctors d ON r.requester_id = d.id
          WHERE r.request_date = ?`,
    args: [tomorrowStr],
  });

  const results: { request_id: number; success: boolean; error?: string }[] = [];

  for (const request of result.rows) {
    const responses = await db.execute({
      sql: `SELECT res.*, d.name as responder_name, d.email as responder_email
            FROM responses res
            JOIN doctors d ON res.responder_id = d.id
            WHERE res.request_id = ?`,
      args: [request.id],
    });

    for (const response of responses.rows) {
      const responder = response as unknown as Doctor & { responder_name: string; responder_email: string };
      try {
        await sendReminder(
          [request.requester_email as string, responder.responder_email],
          request.request_date as string,
          request.institution as string,
          request.start_time as string,
          request.end_time as string,
          request.requester_name as string,
          responder.responder_name
        );
        results.push({ request_id: request.id as number, success: true });
      } catch (e: unknown) {
        const error = e as Error;
        results.push({ request_id: request.id as number, success: false, error: error.message });
      }
    }
  }

  return NextResponse.json({ date: tomorrowStr, results });
}

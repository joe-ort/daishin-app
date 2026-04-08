import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Public endpoint: returns open requests WITHOUT requester name
export async function GET() {
  await initDb();
  const db = getDb();

  const today = new Date().toISOString().split('T')[0];

  const result = await db.execute({
    sql: `SELECT r.id, r.request_date, r.institution, r.start_time, r.end_time,
                 r.work_type, r.salary, r.is_department_related, r.notes, r.requester_id
          FROM requests r
          WHERE r.status = 'open'
            AND r.request_date >= ?
            AND (SELECT COUNT(*) FROM responses res WHERE res.request_id = r.id) = 0
          ORDER BY r.request_date ASC`,
    args: [today],
  });

  return NextResponse.json(result.rows);
}

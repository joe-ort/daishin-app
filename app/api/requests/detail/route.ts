import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

// Public endpoint: returns a single request by ID with requester name (no email)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: `SELECT r.id, r.request_date, r.institution, r.start_time, r.end_time,
                 r.work_type, r.salary, r.is_department_related, r.notes, r.status,
                 d.name as requester_name
          FROM requests r
          JOIN doctors d ON r.requester_id = d.id
          WHERE r.id = ?`,
    args: [Number(id)],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: '依頼が見つかりません' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  await initDb();
  const db = getDb();

  const result = await db.execute(`
    SELECT
      r.id as 依頼ID,
      r.request_date as 代診日,
      r.institution as 医療機関,
      r.start_time || '〜' || r.end_time as 時間,
      CASE r.work_type
        WHEN 'outpatient' THEN '外来'
        WHEN 'outpatient_surgery' THEN '外来＋手術'
        WHEN 'surgery' THEN '手術'
        WHEN 'other' THEN 'その他'
        ELSE r.work_type
      END as 業務内容,
      r.salary as 給与,
      CASE r.is_department_related WHEN 1 THEN 'はい' ELSE 'いいえ' END as 医局関連外勤,
      r.notes as 備考,
      d.name as 依頼者,
      d.email as 依頼者メール,
      r.status as ステータス,
      r.created_at as 依頼日時,
      resp.responder_name as 応募者,
      resp.responder_email as 応募者メール,
      CASE resp.has_experience WHEN 1 THEN 'あり' ELSE 'なし' END as 同医療機関勤務歴,
      resp.questions as 質問,
      resp.response_date as 応募日時
    FROM requests r
    JOIN doctors d ON r.requester_id = d.id
    LEFT JOIN (
      SELECT res.request_id, doc.name as responder_name, doc.email as responder_email,
             res.has_experience, res.questions, res.created_at as response_date
      FROM responses res
      JOIN doctors doc ON res.responder_id = doc.id
    ) resp ON r.id = resp.request_id
    ORDER BY r.created_at DESC
  `);

  const data = result.rows.map(row => {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      obj[key] = value;
    }
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '代診一覧');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="daishin_report_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}

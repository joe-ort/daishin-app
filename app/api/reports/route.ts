import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  await initDb();
  const db = getDb();

  const today = new Date().toISOString().split('T')[0];

  // Get all requests with requester info and response count
  const result = await db.execute(`
    SELECT
      r.id,
      r.request_date,
      r.institution,
      r.start_time || '〜' || r.end_time as time_range,
      CASE r.work_type
        WHEN 'outpatient' THEN '外来'
        WHEN 'outpatient_surgery' THEN '外来＋手術'
        WHEN 'surgery' THEN '手術'
        WHEN 'other' THEN 'その他'
        ELSE r.work_type
      END as work_type_label,
      r.salary,
      CASE r.is_department_related WHEN 1 THEN 'はい' ELSE 'いいえ' END as dept_related,
      r.notes,
      d.name as requester_name,
      d.email as requester_email,
      r.status,
      r.created_at,
      (SELECT COUNT(*) FROM responses res WHERE res.request_id = r.id) as response_count
    FROM requests r
    JOIN doctors d ON r.requester_id = d.id
    ORDER BY r.request_date DESC
  `);

  // Get all responses
  const responsesResult = await db.execute(`
    SELECT res.request_id, doc.name as responder_name, doc.email as responder_email,
           CASE res.has_experience WHEN 1 THEN 'あり' ELSE 'なし' END as has_experience,
           res.questions, res.created_at as response_date
    FROM responses res
    JOIN doctors doc ON res.responder_id = doc.id
    ORDER BY res.created_at DESC
  `);

  // Build response map: request_id -> responses[]
  const responseMap = new Map<number, Array<Record<string, unknown>>>();
  for (const row of responsesResult.rows) {
    const rid = row.request_id as number;
    if (!responseMap.has(rid)) responseMap.set(rid, []);
    responseMap.get(rid)!.push(row as Record<string, unknown>);
  }

  // Categorize requests
  const currentRequests: Array<Record<string, unknown>> = []; // open & request_date >= today
  const pastWithResponses: Array<Record<string, unknown>> = [];
  const pastWithoutResponses: Array<Record<string, unknown>> = [];

  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    const isCurrentOpen = r.status === 'open' && (r.request_date as string) >= today;
    const hasResponses = (r.response_count as number) > 0;

    if (isCurrentOpen) {
      currentRequests.push(r);
    } else if (hasResponses) {
      pastWithResponses.push(r);
    } else {
      pastWithoutResponses.push(r);
    }
  }

  // Build rows for Excel: 1 row per request, first responder only
  function buildRows(requests: Array<Record<string, unknown>>, category: string) {
    const rows: Array<Record<string, unknown>> = [];
    for (const r of requests) {
      const responses = responseMap.get(r.id as number) || [];
      const hasResp = responses.length > 0;
      const first = responses.length > 0 ? responses[0] : null;

      rows.push({
        '区分': category,
        '代診日': r.request_date,
        '医療機関': r.institution,
        '時間': r.time_range,
        '業務内容': r.work_type_label,
        '給与': r.salary,
        '医局関連外勤': r.dept_related,
        '備考': r.notes,
        '依頼者': r.requester_name,
        '依頼者メール': r.requester_email,
        '応募あり': hasResp ? '○' : '',
        '応募者': first ? first.responder_name : '',
        '応募者メール': first ? first.responder_email : '',
        '同医療機関勤務歴': first ? first.has_experience : '',
        '質問': first ? first.questions : '',
        '応募日時': first ? first.response_date : '',
      });
    }
    return rows;
  }

  const allRows = [
    ...buildRows(currentRequests, '募集中'),
    ...buildRows(pastWithResponses, '応募あり'),
    ...buildRows(pastWithoutResponses, '応募なし'),
  ];

  // If no data, add a placeholder
  if (allRows.length === 0) {
    allRows.push({ '区分': 'データなし' });
  }

  const ws = XLSX.utils.json_to_sheet(allRows);

  // Auto-adjust column widths
  const colWidths = Object.keys(allRows[0]).map(key => {
    const maxLen = Math.max(
      key.length,
      ...allRows.map(r => String(r[key] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

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

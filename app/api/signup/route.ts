import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

async function getSmtpSettings() {
  const db = getDb();
  const result = await db.execute("SELECT key, value FROM settings WHERE key LIKE 'smtp_%' OR key = 'app_url'");
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key as string] = row.value as string;
  }
  return settings;
}

// GET: list pending signup requests (admin)
export async function GET() {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT * FROM signup_requests ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}

// POST: new signup request (public) or approve/reject (admin)
export async function POST(req: NextRequest) {
  const body = await req.json();
  await initDb();
  const db = getDb();

  // Admin action: approve or reject
  if (body.action === 'approve') {
    const signup = await db.execute({ sql: 'SELECT * FROM signup_requests WHERE id = ?', args: [body.id] });
    const row = signup.rows[0];
    if (!row) return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });

    const token = crypto.randomUUID();
    await db.execute({
      sql: 'INSERT INTO doctors (name, email, token, doctor_group) VALUES (?, ?, ?, ?)',
      args: [row.name, row.email, token, row.doctor_group],
    });
    await db.execute({ sql: "UPDATE signup_requests SET status = 'approved' WHERE id = ?", args: [body.id] });

    // Send approval email to the doctor
    const settings = await getSmtpSettings();
    const smtpUser = settings.smtp_user;
    const smtpPass = settings.smtp_pass;
    if (smtpUser && smtpPass) {
      const appUrl = settings.app_url || 'https://daishin-app.vercel.app';
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host || 'smtp.gmail.com',
        port: Number(settings.smtp_port || 587),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: settings.smtp_from || '代診調整',
        to: row.email as string,
        subject: '【代診調整】アカウントが承認されました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a3a4a;">代診調整</h2>
            <p>${row.name} 先生</p>
            <p>アカウントが承認されました。以下のリンクから代診依頼が可能です。</p>
            <p style="margin: 24px 0;">
              <a href="${appUrl}/request/${token}" style="background: #1a3a4a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                代診依頼ページへ
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">このリンクはあなた専用です。他の方と共有しないでください。</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  }

  if (body.action === 'reject') {
    await db.execute({ sql: "UPDATE signup_requests SET status = 'rejected' WHERE id = ?", args: [body.id] });
    return NextResponse.json({ success: true });
  }

  // Public: new signup request
  const { name, email, doctor_group } = body;

  // Check if already registered or pending
  const existing = await db.execute({ sql: 'SELECT id FROM doctors WHERE email = ?', args: [email] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 400 });
  }
  const pending = await db.execute({ sql: "SELECT id FROM signup_requests WHERE email = ? AND status = 'pending'", args: [email] });
  if (pending.rows.length > 0) {
    return NextResponse.json({ error: '既に申請中です。管理者の承認をお待ちください' }, { status: 400 });
  }

  await db.execute({
    sql: 'INSERT INTO signup_requests (name, email, doctor_group) VALUES (?, ?, ?)',
    args: [name, email, doctor_group || 'substitute_available'],
  });

  // Notify admin
  const settings = await getSmtpSettings();
  const adminEmail = settings.smtp_user;
  const smtpPass = settings.smtp_pass;
  if (adminEmail && smtpPass) {
    const appUrl = settings.app_url || 'https://daishin-app.vercel.app';
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host || 'smtp.gmail.com',
      port: Number(settings.smtp_port || 587),
      secure: false,
      auth: { user: adminEmail, pass: smtpPass },
    });
    await transporter.sendMail({
      from: settings.smtp_from || '代診調整',
      to: adminEmail,
      subject: `【代診調整】新規サインアップ申請: ${name}先生`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a3a4a;">代診調整 - 新規申請</h2>
          <p>新しいサインアップ申請がありました。</p>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>氏名:</strong> ${name}</p>
            <p><strong>メール:</strong> ${email}</p>
            <p><strong>グループ:</strong> ${doctor_group === 'substitute_available' ? '代診可能' : '依頼のみ'}</p>
          </div>
          <p style="margin: 24px 0;">
            <a href="${appUrl}/admin/doctors" style="background: #1a3a4a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              管理画面で確認する
            </a>
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true });
}

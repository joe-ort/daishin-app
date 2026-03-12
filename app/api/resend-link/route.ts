import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
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

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  await initDb();
  const db = getDb();

  const result = await db.execute({ sql: 'SELECT name, token FROM doctors WHERE email = ? AND active = 1', args: [email] });
  const doctor = result.rows[0];

  // Always return success to avoid leaking whether an email is registered
  if (!doctor) {
    return NextResponse.json({ success: true });
  }

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
      to: email,
      subject: '【代診調整】個人リンクのご案内',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a3a4a;">代診調整</h2>
          <p>${doctor.name} 先生</p>
          <p>代診依頼用の個人リンクをお送りします。</p>
          <p style="margin: 24px 0;">
            <a href="${appUrl}/request/${doctor.token}" style="background: #1a3a4a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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

import nodemailer from 'nodemailer';
import { getDb, initDb } from '@/lib/db';

async function getSmtpSettings() {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT key, value FROM settings WHERE key LIKE 'smtp_%' OR key = 'app_url'");
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key as string] = row.value as string;
  }
  return settings;
}

async function getTransporter() {
  const settings = await getSmtpSettings();
  return {
    transporter: nodemailer.createTransport({
      host: settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(settings.smtp_port || process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: settings.smtp_user || process.env.SMTP_USER,
        pass: settings.smtp_pass || process.env.SMTP_PASS,
      },
    }),
    from: settings.smtp_from || process.env.SMTP_FROM || '代診調整',
    appUrl: settings.app_url || process.env.APP_URL || 'https://daishin-app.vercel.app',
  };
}

const WORK_TYPE_LABELS: Record<string, string> = {
  outpatient: '外来',
  'outpatient_surgery': '外来＋手術',
  surgery: '手術',
  other: 'その他',
};

export async function sendRequestNotification(
  toEmails: string[],
  requesterName: string,
  request: {
    id: number;
    request_date: string;
    institution: string;
    start_time: string;
    end_time: string;
    work_type: string;
    salary: string;
    is_department_related: boolean;
    notes: string;
  }
) {
  const { transporter, from, appUrl } = await getTransporter();
  const workLabel = WORK_TYPE_LABELS[request.work_type] || request.work_type;

  for (const to of toEmails) {
    await transporter.sendMail({
      from,
      to,
      subject: `【代診依頼】${request.request_date} ${request.institution} - ${requesterName}先生より`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">代診調整</h2>
          <p>${requesterName}先生から代診依頼が届いています。</p>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: bold;">代診日</td><td style="padding: 4px 8px;">${request.request_date}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">医療機関</td><td style="padding: 4px 8px;">${request.institution}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">時間</td><td style="padding: 4px 8px;">${request.start_time}〜${request.end_time}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">業務内容</td><td style="padding: 4px 8px;">${workLabel}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">給与</td><td style="padding: 4px 8px;">${request.salary || '要相談'}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">医局関連外勤</td><td style="padding: 4px 8px;">${request.is_department_related ? 'はい' : 'いいえ'}</td></tr>
              ${request.notes ? `<tr><td style="padding: 4px 8px; font-weight: bold;">備考</td><td style="padding: 4px 8px;">${request.notes}</td></tr>` : ''}
            </table>
          </div>
          <p style="margin: 24px 0;">
            <a href="${appUrl}/respond/${request.id}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              代診可能と回答する
            </a>
          </p>
        </div>
      `,
    });
  }
}

export async function sendResponseNotification(
  toEmails: string[],
  responderName: string,
  responderEmail: string,
  request: {
    request_date: string;
    institution: string;
    start_time: string;
    end_time: string;
    work_type: string;
    salary: string;
    is_department_related: boolean;
    notes: string;
  },
  response: {
    has_experience: boolean;
    questions: string;
  }
) {
  const { transporter, from } = await getTransporter();
  const workLabel = WORK_TYPE_LABELS[request.work_type] || request.work_type;

  for (const to of toEmails) {
    await transporter.sendMail({
      from,
      to,
      subject: `【代診応募】${request.request_date} ${request.institution} - ${responderName}先生が対応可能`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">代診調整</h2>
          <p><strong>${responderName}先生</strong>が代診に対応可能と回答しました。</p>

          <h3 style="color: #374151; margin-top: 24px;">依頼内容</h3>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 8px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: bold;">代診日</td><td style="padding: 4px 8px;">${request.request_date}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">医療機関</td><td style="padding: 4px 8px;">${request.institution}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">時間</td><td style="padding: 4px 8px;">${request.start_time}〜${request.end_time}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">業務内容</td><td style="padding: 4px 8px;">${workLabel}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">給与</td><td style="padding: 4px 8px;">${request.salary || '要相談'}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">医局関連外勤</td><td style="padding: 4px 8px;">${request.is_department_related ? 'はい' : 'いいえ'}</td></tr>
              ${request.notes ? `<tr><td style="padding: 4px 8px; font-weight: bold;">備考</td><td style="padding: 4px 8px;">${request.notes}</td></tr>` : ''}
            </table>
          </div>

          <h3 style="color: #374151; margin-top: 24px;">応募者情報</h3>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 8px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: bold;">氏名</td><td style="padding: 4px 8px;">${responderName}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">メール</td><td style="padding: 4px 8px;">${responderEmail}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">同医療機関での勤務歴</td><td style="padding: 4px 8px;">${response.has_experience ? 'あり' : 'なし'}</td></tr>
              ${response.questions ? `<tr><td style="padding: 4px 8px; font-weight: bold;">質問・その他</td><td style="padding: 4px 8px;">${response.questions}</td></tr>` : ''}
            </table>
          </div>
        </div>
      `,
    });
  }
}

export async function sendReminder(
  toEmails: string[],
  requestDate: string,
  institution: string,
  startTime: string,
  endTime: string,
  requesterName: string,
  responderName: string
) {
  const { transporter, from } = await getTransporter();

  for (const to of toEmails) {
    await transporter.sendMail({
      from,
      to,
      subject: `【リマインド】明日の代診: ${institution}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">代診調整 - リマインド</h2>
          <p>明日の代診についてのリマインドです。</p>
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: bold;">代診日</td><td style="padding: 4px 8px;">${requestDate}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">医療機関</td><td style="padding: 4px 8px;">${institution}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">時間</td><td style="padding: 4px 8px;">${startTime}〜${endTime}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">依頼者</td><td style="padding: 4px 8px;">${requesterName}先生</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: bold;">代診担当</td><td style="padding: 4px 8px;">${responderName}先生</td></tr>
            </table>
          </div>
        </div>
      `,
    });
  }
}

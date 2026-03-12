'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.smtp_host) setSmtpHost(data.smtp_host);
      if (data.smtp_port) setSmtpPort(data.smtp_port);
      if (data.smtp_user) setSmtpUser(data.smtp_user);
      if (data.smtp_pass) setSmtpPass(data.smtp_pass);
      if (data.smtp_from) setSmtpFrom(data.smtp_from);
      if (data.app_url) setAppUrl(data.app_url);
    });
  }, [authenticated]);

  const handleLogin = () => {
    if (password === 'UTort') { setAuthenticated(true); setAuthError(false); }
    else { setAuthError(true); }
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser,
        smtp_pass: smtpPass, smtp_from: smtpFrom || `代診調整 <${smtpUser}>`, app_url: appUrl,
      }),
    });
    setSaved(true); setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!authenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">管理者設定</h1>
        <p className="text-gray-500">管理者パスワードを入力してください</p>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-sm">
          <input type="password" value={password}
            onChange={e => { setPassword(e.target.value); setAuthError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="パスワード"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-3" />
          {authError && <p className="text-red-500 text-sm mb-3">パスワードが正しくありません</p>}
          <button onClick={handleLogin} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">管理者設定</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg space-y-4">
        <h2 className="font-bold text-lg">メール送信設定（Gmail）</h2>
        <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
          <p className="font-bold mb-1">Gmailの場合の設定手順：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Googleアカウントの「セキュリティ」→「2段階認証」を有効にする</li>
            <li>「アプリパスワード」を生成する</li>
            <li>生成された16文字のパスワードを下の「アプリパスワード」欄に入力</li>
          </ol>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTPホスト</label>
          <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTPポート</label>
          <input type="text" value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gmailアドレス</label>
          <input type="email" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="example@gmail.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">アプリパスワード</label>
          <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="Googleで生成した16文字のパスワード"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">送信元表示名（任意）</label>
          <input type="text" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="代診調整"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">アプリURL</label>
          <input type="text" value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://daishin-app.vercel.app"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? '保存中...' : '保存'}
          </button>
          {saved && <span className="text-green-600 text-sm">保存しました</span>}
        </div>
      </div>
    </div>
  );
}

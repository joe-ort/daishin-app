'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/doctors', label: '先生管理' },
  { href: '/admin/reports', label: '一覧・Excel' },
  { href: '/admin/settings', label: '設定' },
];

interface LoggedInUser {
  id: number;
  name: string;
  token: string;
  doctor_group: string;
}

// Broadcast login state to page via custom event
function broadcastLogin(user: LoggedInUser | null, admin: boolean) {
  window.dispatchEvent(new CustomEvent('nav-auth', { detail: { user, admin } }));
}

export default function Nav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPwInput, setShowPwInput] = useState(false);
  const [pw, setPw] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Doctor login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [showLoginInput, setShowLoginInput] = useState(false);

  if (pathname?.startsWith('/request/') || pathname?.startsWith('/respond/') || pathname === '/signup') {
    return null;
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === 'UTort') {
      setIsAdmin(true);
      setShowPwInput(false);
      setPw('');
      broadcastLogin(null, true);
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/doctors');
    const doctors = await res.json();
    const found = doctors.find((d: LoggedInUser & { email: string }) => d.email === loginEmail);
    if (found) {
      setLoggedInUser(found);
      setShowLoginInput(false);
      broadcastLogin(found, false);
    } else {
      setLoginError('登録されていないメールアドレスです');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setLoggedInUser(null);
    setLoginEmail('');
    broadcastLogin(null, false);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus('sending');
    await fetch('/api/resend-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resendEmail }),
    });
    setResendStatus('sent');
    setResendEmail('');
  };

  const isLoggedIn = loggedInUser || isAdmin;

  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-emblem.png" alt="東京大学整形外科学教室" className="h-20 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-4xl tracking-wide">代診調整</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">
              {loggedInUser ? `${loggedInUser.name} 先生` : '管理者'}
            </span>
            {isAdmin && adminLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-[#1a3a4a] text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/60 hover:shadow-sm'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full text-xs text-gray-400 hover:text-gray-600"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            {/* Row 1: サインアップ + ログイン */}
            <div className="flex items-center gap-2">
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#1a3a4a] text-white hover:bg-[#0f2a36] transition-all"
              >
                サインアップ
              </Link>
              {!showLoginInput ? (
                <button
                  onClick={() => setShowLoginInput(true)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-white/60 hover:shadow-sm transition-all"
                >
                  ログイン
                </button>
              ) : (
                <form onSubmit={handleDoctorLogin} className="flex items-center gap-1">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }}
                    placeholder="メールアドレス"
                    autoFocus
                    className="px-3 py-1 border border-gray-300 rounded-full text-sm w-44 focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
                  />
                  <button type="submit" className="px-3 py-1 bg-[#1a3a4a] text-white text-sm rounded-full hover:bg-[#0f2a36]">
                    OK
                  </button>
                  <button type="button" onClick={() => { setShowLoginInput(false); setLoginEmail(''); setLoginError(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </form>
              )}
            </div>
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}

            {/* Row 2: 管理者ログイン + リンク再送 */}
            <div className="flex items-center gap-2">
              {!showPwInput ? (
                <button
                  onClick={() => setShowPwInput(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all"
                >
                  管理者ログイン
                </button>
              ) : (
                <form onSubmit={handleAdminLogin} className="flex items-center gap-1">
                  <input
                    type="password"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    placeholder="パスワード"
                    autoFocus
                    className="px-3 py-1 border border-gray-300 rounded-full text-sm w-24 focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
                  />
                  <button type="submit" className="px-2 py-1 bg-[#1a3a4a] text-white text-xs rounded-full hover:bg-[#0f2a36]">
                    OK
                  </button>
                  <button type="button" onClick={() => { setShowPwInput(false); setPw(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </form>
              )}
              <div className="relative">
                <button
                  onClick={() => { setShowResend(!showResend); setResendStatus('idle'); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all"
                >
                  リンクを忘れた方
                </button>
                {showResend && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72 z-20">
                    <p className="text-xs text-gray-500 mb-2">登録メールアドレスを入力すると個人リンクを再送します</p>
                    <form onSubmit={handleResend} className="flex gap-2">
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={e => setResendEmail(e.target.value)}
                        required
                        placeholder="メールアドレス"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
                      />
                      <button
                        type="submit"
                        disabled={resendStatus === 'sending'}
                        className="px-3 py-1.5 bg-[#1a3a4a] text-white text-sm rounded-lg hover:bg-[#0f2a36] disabled:opacity-50"
                      >
                        {resendStatus === 'sending' ? '...' : '送信'}
                      </button>
                    </form>
                    {resendStatus === 'sent' && (
                      <p className="text-xs text-green-600 mt-2">登録済みのアドレスであればリンクを送信しました。</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

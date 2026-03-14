'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/doctors', label: '先生管理' },
  { href: '/admin/reports', label: '一覧・Excel' },
  { href: '/admin/settings', label: '設定' },
];

export default function Nav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPwInput, setShowPwInput] = useState(false);
  const [pw, setPw] = useState('');

  if (pathname?.startsWith('/request/') || pathname?.startsWith('/respond/') || pathname === '/signup') {
    return null;
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === 'UTort') {
      setIsAdmin(true);
      setShowPwInput(false);
      setPw('');
    } else {
      alert('パスワードが正しくありません');
    }
  };

  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-emblem.png" alt="東京大学整形外科学教室" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              {adminLinks.map(link => (
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
                onClick={() => setIsAdmin(false)}
                className="px-4 py-2 rounded-full text-xs text-gray-400 hover:text-gray-600"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#1a3a4a] text-white hover:bg-[#0f2a36] transition-all"
              >
                サインアップ
              </Link>
              {!showPwInput ? (
                <button
                  onClick={() => setShowPwInput(true)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-white/60 hover:shadow-sm transition-all"
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
                    className="px-3 py-1.5 border border-gray-300 rounded-full text-sm w-28 focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#1a3a4a] text-white text-sm rounded-full hover:bg-[#0f2a36]">
                    OK
                  </button>
                  <button type="button" onClick={() => { setShowPwInput(false); setPw(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

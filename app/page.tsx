'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const WORK_TYPE_LABELS: Record<string, string> = {
  outpatient: '外来',
  outpatient_surgery: '外来＋手術',
  surgery: '手術',
  other: 'その他',
};

const features = [
  {
    title: '代診依頼',
    lines: ['日時・医療機関・業務内容を', '入力するだけ。', '代診可能な先生に自動通知。'],
  },
  {
    title: '応募・マッチング',
    lines: ['対応可能な先生が', 'ワンクリックで応募。', '依頼者と管理者に即座に通知。'],
  },
  {
    title: '自動リマインド',
    lines: ['代診前日に双方へ', 'リマインドメールを自動送信。', '忘れ防止も万全です。'],
  },
  {
    title: 'Excel出力',
    lines: ['全依頼・応募データを', 'Excelでいつでもダウンロード。', '管理業務を効率化。'],
  },
];

interface OpenRequest {
  id: number;
  request_date: string;
  institution: string;
  start_time: string;
  end_time: string;
  work_type: string;
  salary: string;
  is_department_related: number;
  notes: string;
  response_count: number;
  requester_id: number;
}

interface LoggedInUser {
  id: number;
  name: string;
  token: string;
  doctor_group: string;
}

export default function Home() {
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [showResend, setShowResend] = useState(false);
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const fetchOpenRequests = useCallback(() => {
    fetch('/api/requests/open')
      .then(res => res.json())
      .then(data => setOpenRequests(data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchOpenRequests(); }, [fetchOpenRequests]);

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

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/doctors');
    const doctors = await res.json();
    const found = doctors.find((d: LoggedInUser & { email: string }) => d.email === loginEmail);
    if (found) {
      setLoggedInUser(found);
    } else {
      setLoginError('登録されていないメールアドレスです');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'UTort') {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsAdmin(false);
    setLoginEmail('');
    setAdminPassword('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この依頼を削除しますか？')) return;
    const body: { id: number; token?: string } = { id };
    if (loggedInUser) body.token = loggedInUser.token;
    await fetch('/api/requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    fetchOpenRequests();
  };

  const isLoggedIn = loggedInUser || isAdmin;

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="pt-16 space-y-8 max-w-2xl">
        <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-[#1a1a1a]">
          医局外勤管理をシンプルに
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed max-w-md">
          依頼・応募・通知・リマインドまで一気通貫。<br />医局の代診業務をデジタル化。
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a4a] text-white rounded-xl font-medium hover:bg-[#0f2a36] transition-colors shadow-lg"
          >
            サインアップ申請
          </Link>
          <Link
            href="/admin/doctors"
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:border-gray-400 hover:bg-white/50 transition-colors"
          >
            管理者ログイン
          </Link>
        </div>

        <div>
          <button
            onClick={() => setShowResend(!showResend)}
            className="text-sm text-[#1a6b7a] hover:underline"
          >
            個人リンクを忘れた方はこちら
          </button>
          {showResend && (
            <form onSubmit={handleResend} className="mt-3 flex gap-2 max-w-sm">
              <input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                required
                placeholder="登録メールアドレス"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
              />
              <button
                type="submit"
                disabled={resendStatus === 'sending'}
                className="px-4 py-2 bg-[#1a3a4a] text-white text-sm rounded-lg font-medium hover:bg-[#0f2a36] disabled:opacity-50"
              >
                {resendStatus === 'sending' ? '送信中...' : '再送'}
              </button>
            </form>
          )}
          {resendStatus === 'sent' && (
            <p className="mt-2 text-sm text-green-600">登録済みのアドレスであればリンクをメール送信しました。</p>
          )}
        </div>
      </section>

      {/* Open Requests */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm text-[#1a6b7a] font-medium tracking-wider">募集中</span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 leading-tight">
              代診依頼一覧
            </h2>
          </div>

          {/* Login area */}
          <div className="text-right">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {loggedInUser ? `${loggedInUser.name} 先生` : '管理者'}としてログイン中
                </span>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <form onSubmit={handleDoctorLogin} className="flex gap-2">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }}
                    placeholder="メールアドレスでログイン"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#1a3a4a] text-white text-sm rounded-lg hover:bg-[#0f2a36]">
                    ログイン
                  </button>
                </form>
                {!showAdminLogin ? (
                  <button onClick={() => setShowAdminLogin(true)} className="text-xs text-gray-400 hover:underline self-center">
                    管理者
                  </button>
                ) : (
                  <form onSubmit={handleAdminLogin} className="flex gap-1">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="PW"
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm w-20"
                    />
                    <button type="submit" className="px-2 py-1.5 bg-[#1a3a4a] text-white text-sm rounded-lg hover:bg-[#0f2a36]">
                      OK
                    </button>
                  </form>
                )}
              </div>
            )}
            {loginError && <p className="text-xs text-red-500 mt-1">{loginError}</p>}
          </div>
        </div>

        {openRequests.length === 0 ? (
          <p className="text-gray-400 text-center py-8">現在募集中の代診依頼はありません</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openRequests.map(req => {
              const canApply = loggedInUser && loggedInUser.doctor_group === 'substitute_available' && loggedInUser.id !== req.requester_id;
              const canDelete = isAdmin || (loggedInUser && loggedInUser.id === req.requester_id);

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[#1a3a4a]">{req.request_date}</span>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      募集中
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">医療機関:</span> {req.institution}</p>
                    <p><span className="font-medium text-gray-700">時間:</span> {req.start_time}〜{req.end_time}</p>
                    <p><span className="font-medium text-gray-700">業務:</span> {WORK_TYPE_LABELS[req.work_type] || req.work_type}</p>
                    {req.salary && <p><span className="font-medium text-gray-700">給与:</span> {req.salary}</p>}
                    {req.is_department_related === 1 && (
                      <p className="text-xs text-[#1a6b7a] font-medium">医局関連外勤</p>
                    )}
                  </div>
                  {req.response_count > 0 && (
                    <p className="mt-3 text-xs text-green-600 font-medium">{req.response_count}名応募あり</p>
                  )}

                  {/* Action buttons */}
                  {isLoggedIn && (
                    <div className="mt-4 flex gap-2">
                      {canApply && (
                        <Link
                          href={`/respond/${req.id}`}
                          className="flex-1 text-center px-3 py-2 bg-[#1a6b7a] text-white text-sm rounded-lg font-medium hover:bg-[#145a66] transition-colors"
                        >
                          応募する
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium hover:bg-red-100 transition-colors"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="space-y-12">
        <div>
          <span className="text-sm text-[#1a6b7a] font-medium tracking-wider">機能</span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-2 leading-tight">
            すべての代診業務を<br />ひとつの画面で
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {f.lines.map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-12">
        <div>
          <span className="text-sm text-[#1a6b7a] font-medium tracking-wider">使い方</span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-2 leading-tight">
            3ステップで完結
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { step: '01', title: '先生の情報を登録', desc: '医局の先生を登録し、代診可能グループと依頼のみグループに分けます。' },
            { step: '02', title: '代診を依頼', desc: '個人リンクから依頼フォームに入力。代診可能グループに自動でメール通知。' },
            { step: '03', title: '応募・確定', desc: '対応可能な先生が応募すると、依頼者と管理者に即通知。前日リマインドも自動。' },
          ].map((s, i) => (
            <div key={i} className="relative">
              <span className="text-6xl font-bold text-[#1a6b7a]/10">{s.step}</span>
              <h3 className="font-bold text-xl mt-2 mb-3">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

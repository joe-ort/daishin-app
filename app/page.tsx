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
  requester_id: number;
}

interface LoggedInUser {
  id: number;
  name: string;
  token: string;
  doctor_group: string;
}

const HOURS = Array.from({ length: 15 }, (_, i) => `${i + 7}:00`);

const WORK_TYPES = [
  { value: 'outpatient', label: '外来' },
  { value: 'outpatient_surgery', label: '外来＋手術' },
  { value: 'surgery', label: '手術' },
  { value: 'other', label: 'その他' },
];

export default function Home() {
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);

  // Login state (synced from Nav via custom event)
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [institution, setInstitution] = useState('');
  const [startTime, setStartTime] = useState('9:00');
  const [endTime, setEndTime] = useState('17:00');
  const [workType, setWorkType] = useState('outpatient');
  const [salary, setSalary] = useState('');
  const [isDepartmentRelated, setIsDepartmentRelated] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const fetchOpenRequests = useCallback(() => {
    fetch('/api/requests/open')
      .then(res => res.json())
      .then(data => setOpenRequests(data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchOpenRequests(); }, [fetchOpenRequests]);

  // Listen for auth events from Nav
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLoggedInUser(detail.user);
      setIsAdmin(detail.admin);
      if (!detail.user && !detail.admin) {
        setShowRequestForm(false);
        setRequestSent(false);
      }
    };
    window.addEventListener('nav-auth', handler);
    return () => window.removeEventListener('nav-auth', handler);
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    setSending(true);
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: loggedInUser.token,
        request_date: requestDate,
        institution,
        start_time: startTime,
        end_time: endTime,
        work_type: workType,
        salary,
        is_department_related: isDepartmentRelated,
        notes,
      }),
    });
    setSending(false);
    setRequestSent(true);
    setShowRequestForm(false);
    setRequestDate(''); setInstitution(''); setStartTime('9:00'); setEndTime('17:00');
    setWorkType('outpatient'); setSalary(''); setIsDepartmentRelated(false); setNotes('');
    fetchOpenRequests();
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
      <section className="pt-8 space-y-8 max-w-2xl">
        <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-[#1a1a1a]">
          医局外勤管理をシンプルに
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed max-w-md">
          依頼・応募・通知・リマインドまで一気通貫。<br />医局の代診業務をデジタル化。
        </p>
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

          {loggedInUser && (
            <button
              onClick={() => { setShowRequestForm(!showRequestForm); setRequestSent(false); }}
              className="px-4 py-2 bg-[#1a3a4a] text-white text-sm rounded-lg font-medium hover:bg-[#0f2a36]"
            >
              代診依頼を作成
            </button>
          )}
        </div>

        {/* Request sent message */}
        {requestSent && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200 text-center">
            <p className="font-bold text-[#1a3a4a]">✅ 代診依頼を送信しました</p>
            <p className="text-sm text-gray-500 mt-1">代診可能な先生にメールで通知されました。</p>
          </div>
        )}

        {/* Inline request form */}
        {showRequestForm && loggedInUser && (
          <form onSubmit={handleRequestSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-[#1a3a4a]">代診依頼フォーム</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代診希望日</label>
                <input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">医療機関名</label>
                <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} required
                  placeholder="例：〇〇病院"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                <select value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]">
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                <select value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]">
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業務内容</label>
                <select value={workType} onChange={e => setWorkType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]">
                  {WORK_TYPES.map(wt => <option key={wt.value} value={wt.value}>{wt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">給与</label>
                <input type="text" value={salary} onChange={e => setSalary(e.target.value)}
                  placeholder="例：50,000円"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDepartmentRelated} onChange={e => setIsDepartmentRelated(e.target.checked)}
                  className="rounded text-[#1a6b7a]" />
                <span className="text-sm font-medium text-gray-700">医局関連外勤</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="その他の情報があれば入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={sending}
                className="px-6 py-2.5 bg-[#1a3a4a] text-white rounded-xl font-medium hover:bg-[#0f2a36] transition-colors disabled:opacity-50">
                {sending ? '送信中...' : '代診依頼を送信'}
              </button>
              <button type="button" onClick={() => setShowRequestForm(false)}
                className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        )}

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

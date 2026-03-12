'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('substitute_available');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, doctor_group: group }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-[#1a3a4a] mb-2">申請を受け付けました</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            管理者が承認すると、代診依頼用の個人リンクがメールで届きます。しばらくお待ちください。
          </p>
        </div>
        <Link href="/" className="text-sm text-[#1a6b7a] hover:underline">
          トップページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#1a3a4a]">サインアップ申請</h1>
        <p className="text-gray-500 text-sm">代診調整システムへの利用申請フォームです。<br />管理者の承認後、個人リンクが発行されます。</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="例：田中　栄"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="example@gmail.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">グループ</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="substitute_available"
                checked={group === 'substitute_available'}
                onChange={e => setGroup(e.target.value)}
                className="text-[#1a6b7a]"
              />
              <span className="text-sm">代診可能（依頼も可）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="request_only"
                checked={group === 'request_only'}
                onChange={e => setGroup(e.target.value)}
                className="text-[#1a6b7a]"
              />
              <span className="text-sm">依頼のみ</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1a3a4a] text-white rounded-xl font-medium hover:bg-[#0f2a36] transition-colors disabled:opacity-50"
        >
          {loading ? '送信中...' : '申請する'}
        </button>
      </form>

      <p className="text-center">
        <Link href="/" className="text-sm text-[#1a6b7a] hover:underline">
          トップページに戻る
        </Link>
      </p>
    </div>
  );
}

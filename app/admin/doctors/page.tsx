'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Doctor } from '@/lib/types';

interface SignupRequest {
  id: number;
  name: string;
  email: string;
  doctor_group: string;
  status: string;
  created_at: string;
}

const GROUP_LABELS: Record<string, string> = {
  substitute_available: '代診可能',
  request_only: '依頼のみ',
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [signups, setSignups] = useState<SignupRequest[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('substitute_available');
  const [editId, setEditId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchDoctors = useCallback(async () => {
    const res = await fetch('/api/doctors');
    setDoctors(await res.json());
  }, []);

  const fetchSignups = useCallback(async () => {
    const res = await fetch('/api/signup');
    setSignups(await res.json());
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchDoctors();
      fetchSignups();
    }
  }, [authenticated, fetchDoctors, fetchSignups]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'UTort') {
      setAuthenticated(true);
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, name, email, doctor_group: group, active: 1 }),
      });
    } else {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, doctor_group: group }),
      });
    }
    setName(''); setEmail(''); setGroup('substitute_available'); setEditId(null);
    fetchDoctors();
  };

  const handleEdit = (d: Doctor) => {
    setEditId(d.id); setName(d.name); setEmail(d.email); setGroup(d.doctor_group);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この先生を削除しますか？')) return;
    await fetch('/api/doctors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchDoctors();
  };

  const handleApprove = async (id: number) => {
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id }),
    });
    fetchSignups();
    fetchDoctors();
  };

  const handleReject = async (id: number) => {
    if (!confirm('この申請を却下しますか？')) return;
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', id }),
    });
    fetchSignups();
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4">
          <h1 className="text-xl font-bold text-center text-[#1a3a4a]">管理者ログイン</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]"
          />
          <button type="submit" className="w-full py-2 bg-[#1a3a4a] text-white rounded-lg font-medium hover:bg-[#0f2a36]">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  const pendingSignups = signups.filter(s => s.status === 'pending');
  const processedSignups = signups.filter(s => s.status !== 'pending');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">先生登録</h1>

      {/* Pending Signup Requests */}
      {pendingSignups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            承認待ちの申請（{pendingSignups.length}件）
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 divide-y">
            {pendingSignups.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.doctor_group === 'substitute_available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {GROUP_LABELS[s.doctor_group]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{s.email}</p>
                  <p className="text-xs text-gray-400 mt-1">申請日: {s.created_at}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(s.id)}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleReject(s.id)}
                    className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600"
                  >
                    却下
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-medium text-gray-500">手動登録</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="例：田中　栄"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
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
                className="text-green-600"
              />
              <span className="text-sm">代診可能（依頼も可）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="request_only"
                checked={group === 'request_only'}
                onChange={e => setGroup(e.target.value)}
                className="text-green-600"
              />
              <span className="text-sm">依頼のみ</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          {editId ? '更新' : '登録'}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => { setEditId(null); setName(''); setEmail(''); setGroup('substitute_available'); }}
            className="ml-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            キャンセル
          </button>
        )}
      </form>

      {/* Registered Doctors List */}
      <div>
        <h2 className="text-lg font-bold mb-3">登録済みの先生（{doctors.length}名）</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
          {doctors.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">先生が登録されていません</p>
          ) : (
            doctors.map(d => (
              <div key={d.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.doctor_group === 'substitute_available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {GROUP_LABELS[d.doctor_group]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{d.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    代診依頼リンク: <code className="bg-gray-100 px-1 rounded">{appUrl}/request/{d.token}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(d)} className="text-sm text-blue-600 hover:underline">編集</button>
                  <button onClick={() => handleDelete(d.id)} className="text-sm text-red-500 hover:underline">削除</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Processed Signups History */}
      {processedSignups.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-gray-500">申請履歴</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
            {processedSignups.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between opacity-60">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{s.email}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {s.status === 'approved' ? '承認済み' : '却下'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Doctor } from '@/lib/types';

const GROUP_LABELS: Record<string, string> = {
  substitute_available: '代診可能',
  request_only: '依頼のみ',
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('substitute_available');
  const [editId, setEditId] = useState<number | null>(null);

  const fetchDoctors = useCallback(async () => {
    const res = await fetch('/api/doctors');
    setDoctors(await res.json());
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

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

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">先生登録</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
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
  );
}

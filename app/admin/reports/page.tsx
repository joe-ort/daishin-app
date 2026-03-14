'use client';

import { useState, useEffect } from 'react';

interface RequestRow {
  id: number;
  request_date: string;
  institution: string;
  start_time: string;
  end_time: string;
  work_type: string;
  salary: string;
  is_department_related: number;
  notes: string;
  status: string;
  requester_name: string;
  created_at: string;
}

interface ResponseRow {
  id: number;
  request_id: number;
  responder_name: string;
  responder_email: string;
  has_experience: number;
  questions: string;
  institution: string;
  request_date: string;
  created_at: string;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  outpatient: '外来',
  outpatient_surgery: '外来＋手術',
  surgery: '手術',
  other: 'その他',
};

export default function ReportsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);

  const handleLogin = () => {
    if (password === 'UTort') {
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const fetchData = () => {
    Promise.all([
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/responses').then(r => r.json()),
    ]).then(([req, res]) => {
      setRequests(req);
      setResponses(res);
    });
  };

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
  }, [authenticated]);

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('この依頼を削除しますか？関連する応募も削除されます。')) return;
    await fetch('/api/requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const handleDownload = () => {
    window.open('/api/reports', '_blank');
  };

  if (!authenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">一覧・Excel</h1>
        <p className="text-gray-500">管理者パスワードを入力してください</p>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-sm">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setAuthError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="パスワード"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-3"
          />
          {authError && <p className="text-red-500 text-sm mb-3">パスワードが正しくありません</p>}
          <button onClick={handleLogin} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">一覧・Excel</h1>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Excelダウンロード
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold p-4 border-b">代診依頼一覧（{requests.length}件）</h2>
        {requests.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">まだ依頼がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">代診日</th>
                  <th className="px-4 py-2 text-left">医療機関</th>
                  <th className="px-4 py-2 text-left">時間</th>
                  <th className="px-4 py-2 text-left">業務</th>
                  <th className="px-4 py-2 text-left">依頼者</th>
                  <th className="px-4 py-2 text-left">応募数</th>
                  <th className="px-4 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map(r => {
                  const resCount = responses.filter(res => res.request_id === r.id).length;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{r.request_date}</td>
                      <td className="px-4 py-2">{r.institution}</td>
                      <td className="px-4 py-2">{r.start_time}〜{r.end_time}</td>
                      <td className="px-4 py-2">{WORK_TYPE_LABELS[r.work_type] || r.work_type}</td>
                      <td className="px-4 py-2">{r.requester_name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${resCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {resCount}件
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleDeleteRequest(r.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold p-4 border-b">応募一覧（{responses.length}件）</h2>
        {responses.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">まだ応募がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">代診日</th>
                  <th className="px-4 py-2 text-left">医療機関</th>
                  <th className="px-4 py-2 text-left">応募者</th>
                  <th className="px-4 py-2 text-left">勤務歴</th>
                  <th className="px-4 py-2 text-left">質問</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {responses.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{r.request_date}</td>
                    <td className="px-4 py-2">{r.institution}</td>
                    <td className="px-4 py-2">{r.responder_name}</td>
                    <td className="px-4 py-2">{r.has_experience ? 'あり' : 'なし'}</td>
                    <td className="px-4 py-2">{r.questions || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

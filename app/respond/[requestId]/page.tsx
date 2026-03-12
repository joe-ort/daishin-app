'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const WORK_TYPE_LABELS: Record<string, string> = {
  outpatient: '外来',
  outpatient_surgery: '外来＋手術',
  surgery: '手術',
  other: 'その他',
};

interface RequestData {
  id: number;
  request_date: string;
  institution: string;
  start_time: string;
  end_time: string;
  work_type: string;
  salary: string;
  is_department_related: number;
  notes: string;
  requester_name: string;
}

interface Doctor {
  id: number;
  name: string;
  token: string;
}

export default function RespondPage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [hasExperience, setHasExperience] = useState(false);
  const [questions, setQuestions] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, docRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/doctors'),
      ]);
      const requests = await reqRes.json();
      const allDoctors = await docRes.json();

      const found = requests.find((r: RequestData) => r.id === Number(requestId));
      if (!found) {
        setError('依頼が見つかりません。');
        return;
      }
      setRequest(found);

      // Show only substitute_available doctors
      const available = allDoctors.filter((d: Doctor & { doctor_group: string }) =>
        d.doctor_group === 'substitute_available'
      );
      setDoctors(available);
    } catch {
      setError('データの取得に失敗しました。');
    }
  }, [requestId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) {
      alert('あなたの名前を選択してください');
      return;
    }
    setSending(true);
    await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: Number(requestId),
        token: selectedToken,
        has_experience: hasExperience,
        questions,
      }),
    });
    setSubmitted(true);
    setSending(false);
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center mt-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/logo-emblem.png" alt="" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </div>
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center mt-16 space-y-6">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo-emblem.png" alt="" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">✅</div>
          <p className="font-bold text-lg text-[#1a3a4a] mb-2">応募を送信しました</p>
          <p className="text-gray-500 text-sm">依頼者と管理者にメールで通知されました。</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return <div className="text-center mt-16 text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo-emblem.png" alt="" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </div>
        <p className="text-gray-500">代診応募フォーム</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-lg text-[#1a3a4a] mb-3">依頼内容</h2>
        <div className="space-y-2 text-sm">
          <div className="flex"><span className="font-medium w-32">依頼者:</span><span>{request.requester_name}先生</span></div>
          <div className="flex"><span className="font-medium w-32">代診日:</span><span>{request.request_date}</span></div>
          <div className="flex"><span className="font-medium w-32">医療機関:</span><span>{request.institution}</span></div>
          <div className="flex"><span className="font-medium w-32">時間:</span><span>{request.start_time}〜{request.end_time}</span></div>
          <div className="flex"><span className="font-medium w-32">業務内容:</span><span>{WORK_TYPE_LABELS[request.work_type] || request.work_type}</span></div>
          <div className="flex"><span className="font-medium w-32">給与:</span><span>{request.salary || '要相談'}</span></div>
          <div className="flex"><span className="font-medium w-32">医局関連外勤:</span><span>{request.is_department_related ? 'はい' : 'いいえ'}</span></div>
          {request.notes && <div className="flex"><span className="font-medium w-32">備考:</span><span>{request.notes}</span></div>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-lg text-[#1a3a4a]">応募フォーム</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">あなたの名前</label>
          <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]">
            <option value="">選択してください</option>
            {doctors.map(d => (
              <option key={d.token} value={d.token}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasExperience} onChange={e => setHasExperience(e.target.checked)}
              className="rounded text-[#1a6b7a]" />
            <span className="text-sm font-medium text-gray-700">過去に同医療機関での勤務歴がある</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">質問・その他</label>
          <textarea value={questions} onChange={e => setQuestions(e.target.value)} rows={3}
            placeholder="質問や確認事項があれば入力してください"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
        </div>

        <button type="submit" disabled={sending}
          className="w-full px-6 py-3 bg-[#1a3a4a] text-white rounded-xl font-bold text-lg hover:bg-[#0f2a36] transition-colors disabled:opacity-50">
          {sending ? '送信中...' : '代診可能と回答する'}
        </button>
      </form>
    </div>
  );
}

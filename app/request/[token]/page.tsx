'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${h}:00`;
});

const WORK_TYPES = [
  { value: 'outpatient', label: '外来' },
  { value: 'outpatient_surgery', label: '外来＋手術' },
  { value: 'surgery', label: '手術' },
  { value: 'other', label: 'その他' },
];

export default function RequestPage() {
  const params = useParams();
  const token = params.token as string;

  const [doctorName, setDoctorName] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [requestDate, setRequestDate] = useState('');
  const [institution, setInstitution] = useState('');
  const [startTime, setStartTime] = useState('9:00');
  const [endTime, setEndTime] = useState('17:00');
  const [workType, setWorkType] = useState('outpatient');
  const [salary, setSalary] = useState('');
  const [isDepartmentRelated, setIsDepartmentRelated] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const fetchDoctor = useCallback(async () => {
    const res = await fetch(`/api/requests?token=${token}`);
    if (!res.ok) {
      setError('無効なリンクです。管理者にお問い合わせください。');
      return;
    }
    const data = await res.json();
    setDoctorName(data.doctor.name);
  }, [token]);

  useEffect(() => { fetchDoctor(); }, [fetchDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token, request_date: requestDate, institution, start_time: startTime,
        end_time: endTime, work_type: workType, salary, is_department_related: isDepartmentRelated, notes,
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
          <p className="font-bold text-lg text-[#1a3a4a] mb-2">代診依頼を送信しました</p>
          <p className="text-gray-500 text-sm">代診可能な先生にメールで通知されました。応募があればメールでお知らせします。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo-emblem.png" alt="" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </div>
        <p className="text-gray-500">{doctorName} 先生</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-lg text-[#1a3a4a]">代診依頼フォーム</h2>

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

        <div className="grid grid-cols-2 gap-4">
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

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isDepartmentRelated} onChange={e => setIsDepartmentRelated(e.target.checked)}
              className="rounded text-[#1a6b7a]" />
            <span className="text-sm font-medium text-gray-700">医局関連外勤</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="その他の情報があれば入力してください"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a6b7a] focus:border-[#1a6b7a]" />
        </div>

        <button type="submit" disabled={sending}
          className="w-full px-6 py-3 bg-[#1a3a4a] text-white rounded-xl font-bold text-lg hover:bg-[#0f2a36] transition-colors disabled:opacity-50">
          {sending ? '送信中...' : '代診依頼を送信'}
        </button>
      </form>
    </div>
  );
}

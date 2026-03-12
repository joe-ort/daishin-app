'use client';

import Link from 'next/link';

const cards = [
  {
    href: '/admin/doctors',
    title: '先生登録',
    desc: '先生の登録・グループ管理',
    icon: '👨‍⚕️',
  },
  {
    href: '/admin/reports',
    title: '一覧・Excel',
    desc: '依頼・応募の一覧とExcelダウンロード',
    icon: '📊',
  },
  {
    href: '/admin/settings',
    title: '設定',
    desc: 'メール送信設定（管理者）',
    icon: '⚙️',
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">代診調整くん</h1>
        <p className="text-gray-500">医局内の代診依頼・マッチングを効率化します</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="font-bold text-lg mb-1">{card.title}</h2>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-bold text-green-700 mb-2">使い方</h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li><strong>先生登録</strong>で医局の先生を登録（代診可能グループ / 依頼のみグループ）</li>
          <li>先生は個人リンクから<strong>代診依頼</strong>を作成</li>
          <li>代診可能グループの先生に自動でメール通知</li>
          <li>対応可能な先生が応募→依頼者と管理者にメール通知</li>
          <li>代診前日に<strong>リマインドメール</strong>が自動送信</li>
        </ol>
      </div>
    </div>
  );
}

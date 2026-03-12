'use client';

import Link from 'next/link';

const AVATAR_COLORS = ['bg-[#1a6b7a]', 'bg-[#2d8f6f]', 'bg-[#d4a03c]'];

const mockRequests = [
  { name: '山田 雅彦', initial: '山', date: '2025-06-15', dept: '整形外科外来', status: '調整中', statusColor: 'text-orange-500' },
  { name: '佐藤 健太', initial: '佐', date: '2025-06-18', dept: '再生医療外来', status: '確定', statusColor: 'text-green-600' },
  { name: '中村 奈緒', initial: '中', date: '2025-06-22', dept: '整形外科外来', status: '応募待ち', statusColor: 'text-red-500' },
];

const features = [
  {
    icon: '📝',
    title: '代診依頼',
    lines: ['日時・医療機関・業務内容を', '入力するだけ。', '代診可能な先生に自動通知。'],
  },
  {
    icon: '🤝',
    title: '応募・マッチング',
    lines: ['対応可能な先生が', 'ワンクリックで応募。', '依頼者と管理者に即座に通知。'],
  },
  {
    icon: '🔔',
    title: '自動リマインド',
    lines: ['代診前日に双方へ', 'リマインドメールを自動送信。', '忘れ防止も万全です。'],
  },
  {
    icon: '📊',
    title: 'Excel出力',
    lines: ['全依頼・応募データを', 'Excelでいつでもダウンロード。', '管理業務を効率化。'],
  },
];

export default function Home() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="pt-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-gray-400" />
            <span className="text-sm text-gray-500 tracking-wider">医局代診マネジメントシステム</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-[#1a1a1a]">
            代診調整を、<br />
            <span className="italic text-[#1a6b7a]" style={{ fontFamily: 'Georgia, serif' }}>
              もっとシンプル
            </span><br />
            に。
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed max-w-md">
            依頼・応募・通知・リマインドまで一気通貫。医局の代診業務をデジタル化し、先生方の負担を最小限に。
          </p>

          <div className="flex gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a4a] text-white rounded-xl font-medium hover:bg-[#0f2a36] transition-colors shadow-lg"
            >
              <span>▶</span> サインアップ申請
            </Link>
            <Link
              href="/admin/doctors"
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:border-gray-400 hover:bg-white/50 transition-colors"
            >
              管理者ログイン
            </Link>
          </div>
        </div>

        {/* Floating Card Mockup */}
        <div className="flex-1 relative">
          {/* Floating badge top-right */}
          <div className="absolute -top-4 right-0 bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 z-10">
            <span className="text-sm font-medium">📧 自動メール通知済み</span>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mt-8">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-500 font-medium">代診依頼一覧</span>
              <span className="text-xs font-bold text-[#1a6b7a] bg-[#e8f4f8] px-3 py-1 rounded-full">● 本日 3件</span>
            </div>

            <div className="space-y-4">
              {mockRequests.map((req, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 ${AVATAR_COLORS[i]} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {req.initial}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{req.name} 先生</p>
                    <p className="text-xs text-gray-400">{req.date} ・ {req.dept}</p>
                  </div>
                  <span className={`text-xs font-bold ${req.statusColor}`}>● {req.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge bottom-left */}
          <div className="absolute -bottom-4 left-4 bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 z-10">
            <span className="text-sm font-medium">🔔 前日リマインド設定済み</span>
          </div>
        </div>
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
              <div className="text-3xl mb-4">{f.icon}</div>
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
            { step: '01', title: '先生を登録', desc: '医局の先生を登録し、代診可能グループと依頼のみグループに分けます。' },
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

      {/* CTA */}
      <section className="text-center bg-[#1a3a4a] rounded-3xl p-12 lg:p-16">
        <h2 className="text-3xl font-bold text-white mb-4">代診調整を始めましょう</h2>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">サインアップ申請後、管理者の承認を経て利用開始できます。</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a3a4a] rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
        >
          <span>▶</span> サインアップ申請
        </Link>
      </section>
    </div>
  );
}

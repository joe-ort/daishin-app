'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin/doctors', label: '先生登録' },
  { href: '/admin/reports', label: '一覧・Excel' },
  { href: '/admin/settings', label: '設定' },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/request/') || pathname?.startsWith('/respond/') || pathname === '/signup') {
    return null;
  }

  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-emblem.png" alt="東京大学整形外科学教室" className="h-10 object-contain" />
          <span className="font-bold text-[#1a3a4a] text-xl tracking-wide">代診調整</span>
        </Link>
        <div className="flex items-center gap-2">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-[#1a3a4a] text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/60 hover:shadow-sm'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

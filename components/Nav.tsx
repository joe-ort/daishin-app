'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'ホーム' },
  { href: '/admin/doctors', label: '先生登録' },
  { href: '/admin/reports', label: '一覧・Excel' },
  { href: '/admin/settings', label: '設定' },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/request/') || pathname?.startsWith('/respond/')) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-green-700 whitespace-nowrap">
          代診調整くん
        </Link>
        <div className="flex gap-1 overflow-x-auto">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
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

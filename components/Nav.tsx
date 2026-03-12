'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin/doctors', label: '先生登録', icon: '👥' },
  { href: '/admin/reports', label: '一覧・Excel', icon: '📊' },
  { href: '/admin/settings', label: '設定', icon: '⚙️' },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/request/') || pathname?.startsWith('/respond/')) {
    return null;
  }

  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="東京大学整形外科学教室" className="h-10 object-contain" />
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
              <span className="mr-1.5">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

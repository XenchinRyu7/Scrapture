'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/sessions', label: 'Sessions', icon: '🕷️' },
    { href: '/jobs', label: 'Jobs', icon: '📋' },
    { href: '/results', label: 'Results', icon: '📄' },
    { href: '/configs', label: 'Configs', icon: '⚙️' },
    { href: '/logs', label: 'Logs', icon: '📝' },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 p-6">
      <div className="neu-card p-6 h-full">
        <h1 className="text-2xl font-bold mb-8">Scrapture</h1>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-lg transition-all ${
                pathname === link.href
                  ? 'neu-card-inset'
                  : 'hover:neu-btn'
              }`}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

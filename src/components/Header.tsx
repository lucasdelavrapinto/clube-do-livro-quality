'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-blue-950 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="group">
            <h1 className="text-xl font-bold tracking-tight group-hover:text-amber-200 transition-colors">
              Clube do Livro
            </h1>
            <p className="text-blue-300 text-xs mt-0.5">Gerenciamento do acervo</p>
          </Link>

          <nav className="flex gap-1">
            <NavLink href="/" active={pathname === '/'}>
              Acervo
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-800 text-white'
          : 'text-blue-200 hover:bg-blue-800/60 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

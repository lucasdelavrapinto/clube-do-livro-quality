'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/cadastro';

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-blue-950 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link href={isAuthPage ? '/login' : '/'} className="group">
            <h1 className="text-xl font-bold tracking-tight group-hover:text-amber-200 transition-colors">
              Clube do Livro
            </h1>
            <p className="text-blue-300 text-xs mt-0.5">Gerenciamento do acervo</p>
          </Link>

          {!isAuthPage && (
            <nav className="flex items-center gap-1">
              <NavLink href="/" active={pathname === '/'}>
                Acervo
              </NavLink>
              <NavLink href="/perfil" active={pathname === '/perfil'}>
                Meu perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800/60 hover:text-white transition-colors"
              >
                Sair
              </button>
            </nav>
          )}
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

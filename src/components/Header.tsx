'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSessao } from '@/components/SessaoProvider';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, carregando, sair } = useSessao();

  const emTelaDeAuth = pathname === '/login' || pathname === '/cadastro';

  async function handleSair() {
    await sair();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="bg-blue-950 text-white shadow-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Clube do Livro - Grupo Quality
            </h1>
          </div>

          {/* Enquanto a sessão não foi lida não mostramos nada, para não piscar
              "Login" na cara de quem já está logado. */}
          {!carregando && (
            <nav className="flex shrink-0 items-center gap-3 text-sm">
              {usuario ? (
                <>
                  <span className="hidden text-blue-200 sm:inline">
                    Olá, <strong className="font-medium text-white">{primeiroNome(usuario.name)}</strong>
                  </span>
                  <button
                    onClick={handleSair}
                    className="rounded-lg px-3 py-1.5 font-medium text-blue-200 transition-colors hover:bg-blue-800/60 hover:text-white"
                  >
                    Sair
                  </button>
                </>
              ) : (
                !emTelaDeAuth && (
                  <span className="flex items-center gap-1 text-blue-200">
                    <Link
                      href="/login"
                      className="rounded-lg px-2 py-1.5 font-medium transition-colors hover:bg-blue-800/60 hover:text-white"
                    >
                      Login
                    </Link>
                    <span aria-hidden className="text-blue-400">/</span>
                    <Link
                      href="/cadastro"
                      className="rounded-lg px-2 py-1.5 font-medium transition-colors hover:bg-blue-800/60 hover:text-white"
                    >
                      Cadastrar
                    </Link>
                  </span>
                )
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

/** O nome completo estoura o cabeçalho no celular; o primeiro já identifica. */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

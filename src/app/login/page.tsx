'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessao } from '@/components/SessaoProvider';

/**
 * Para onde ir depois de entrar. Lê `?next=` da URL — só aceita caminho
 * interno, para que um link forjado não redirecione para fora do site.
 */
function destinoPosLogin(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { entrar } = useSessao();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const resultado = await entrar(email, senha);

    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível entrar.');
      setLoading(false);
      return;
    }

    router.push(destinoPosLogin());
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Entrar</h2>
          <p className="mt-1 text-sm text-gray-500">Acesse sua conta para retirar livros</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo
            label="Email"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setErro(''); }}
            placeholder="seuemail@qualitytransportes.com.br"
          />
          <Campo
            label="Senha"
            type="password"
            value={senha}
            onChange={(v) => { setSenha(v); setErro(''); }}
            placeholder="••••••••"
          />

          <div className="-mt-2 text-right">
            <Link href="/esqueci-senha" className="text-xs text-amber-700 hover:underline">
              Esqueci minha senha
            </Link>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="font-medium text-amber-700 hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-gray-400 hover:text-gray-600 hover:underline">
            Voltar ao acervo
          </Link>
        </p>
      </div>
    </main>
  );
}

function Campo({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

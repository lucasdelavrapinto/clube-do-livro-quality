'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessao } from '@/components/SessaoProvider';
import { redefinirSenha } from '@/lib/auth';

/**
 * Destino do link do e-mail de "esqueci minha senha", montado pelo Sistema-Quality
 * como `/redefinir-senha?token=...&email=...`.
 */
export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const token = typeof params.token === 'string' ? params.token : '';
  const email = typeof params.email === 'string' ? params.email : '';

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const router = useRouter();
  const { entrar } = useSessao();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setErro('');

    const resultado = await redefinirSenha({ token, email, senha, confirmacao });

    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível redefinir a senha.');
      setLoading(false);
      return;
    }

    // A senha nova já vale: entra direto em vez de pedir para digitá-la de novo.
    // Se o login recusar (conta sem acesso ao clube, por exemplo), a troca
    // continua feita — só mostra a confirmação com o caminho para o login.
    const login = await entrar(email, senha);
    if (login.ok) {
      router.push('/');
      router.refresh();
      return;
    }

    setConcluido(true);
    setLoading(false);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        {!token || !email ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Link inválido</h2>
            <p className="mt-3 text-sm text-gray-600">
              Este endereço está incompleto. Abra o link direto do e-mail ou peça um novo.
            </p>
            <Link
              href="/esqueci-senha"
              className="mt-6 inline-block text-sm font-medium text-amber-700 hover:underline"
            >
              Pedir um novo link
            </Link>
          </div>
        ) : concluido ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Senha redefinida</h2>
            <p className="mt-3 text-sm text-gray-600">Sua senha foi alterada.</p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Criar nova senha</h2>
              <p className="mt-1 break-all text-sm text-gray-500">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Campo
                label="Nova senha"
                value={senha}
                onChange={(v) => { setSenha(v); setErro(''); }}
                placeholder="Mínimo 8 caracteres"
              />
              <Campo
                label="Confirmar nova senha"
                value={confirmacao}
                onChange={(v) => { setConfirmacao(v); setErro(''); }}
                placeholder="Repita a senha"
              />

              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Link vencido?{' '}
              <Link href="/esqueci-senha" className="font-medium text-amber-700 hover:underline">
                Pedir outro
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="password"
        required
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

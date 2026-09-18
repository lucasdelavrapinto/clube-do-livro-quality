'use client';

import { useState } from 'react';
import Link from 'next/link';
import { pedirRedefinicaoSenha } from '@/lib/auth';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const resultado = await pedirRedefinicaoSenha(email.trim());

    setLoading(false);
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível enviar o e-mail.');
      return;
    }
    setEnviado(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        {enviado ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Confira seu e-mail</h2>
            {/* O servidor não diz se a conta existe — a mensagem também não pode dizer. */}
            <p className="mt-3 text-sm text-gray-600">
              Se houver uma conta com <strong className="break-all">{email.trim()}</strong>, você
              vai receber um link para criar uma nova senha.
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Não chegou em alguns minutos? Confira a caixa de spam ou peça de novo.
            </p>
            <button
              type="button"
              onClick={() => setEnviado(false)}
              className="mt-6 text-sm font-medium text-amber-700 hover:underline"
            >
              Pedir de novo
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Esqueci minha senha</h2>
              <p className="mt-1 text-sm text-gray-500">
                Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErro(''); }}
                  placeholder="seuemail@qualitytransportes.com.br"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="font-medium text-amber-700 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

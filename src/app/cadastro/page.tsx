'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function formatTelefone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function isValidBrazilianPhone(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) return false;

    const ddd = Number(digits.slice(0, 2));
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19,
      21, 22, 24, 27, 28,
      31, 32, 33, 34, 35, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48, 49,
      51, 53, 54, 55,
      61, 62, 63, 64, 65, 66, 67, 68, 69,
      71, 73, 74, 75, 77, 79,
      81, 82, 83, 84, 85, 86, 87, 88, 89,
      91, 92, 93, 94, 95, 96, 97, 98, 99,
    ];
    if (!validDDDs.includes(ddd)) return false;

    // Celular (11 dígitos): primeiro dígito após o DDD deve ser 9
    if (digits.length === 11 && digits[2] !== '9') return false;

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidBrazilianPhone(telefone)) {
      setError('Informe um número de telefone brasileiro válido. Ex: (11) 91234-5678');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nome.trim(),
          telefone: telefone.replace(/\D/g, ''),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main className="flex-1 bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Criar conta</h2>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se no Clube do Livro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => { setNome(e.target.value); setError(''); }}
              placeholder="Seu nome completo"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => { setTelefone(formatTelefone(e.target.value)); setError(''); }}
              placeholder="(00) 00000-0000"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                error.includes('telefone') ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-amber-700 font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  );
}

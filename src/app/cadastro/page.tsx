'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessao } from '@/components/SessaoProvider';
import { formatTelefone, isValidBrazilianPhone } from '@/lib/telefone';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { cadastrar } = useSessao();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidBrazilianPhone(telefone)) {
      setErro('Informe um telefone brasileiro válido. Ex: (11) 91234-5678');
      return;
    }
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

    const resultado = await cadastrar({
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ''),
      email,
      senha,
      confirmacao,
    });

    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível criar a conta.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Criar conta</h2>
          <p className="mt-1 text-sm text-gray-500">Cadastre-se no Clube do Livro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo
            label="Nome completo"
            type="text"
            value={nome}
            onChange={(v) => { setNome(v); setErro(''); }}
            placeholder="Seu nome completo"
          />
          <Campo
            label="Telefone"
            type="tel"
            value={telefone}
            onChange={(v) => { setTelefone(formatTelefone(v)); setErro(''); }}
            placeholder="(11) 91234-5678"
            inputMode="numeric"
          />
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
            placeholder="Mínimo 8 caracteres"
          />
          <Campo
            label="Confirmar senha"
            type="password"
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-amber-700 hover:underline">
            Entrar
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
  inputMode,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'numeric';
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
        inputMode={inputMode}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

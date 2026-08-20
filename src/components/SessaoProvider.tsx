'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { extrairErro, type DadosCadastro, type ResultadoAuth, type Usuario } from '@/lib/auth';

interface Sessao {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<ResultadoAuth>;
  cadastrar: (dados: DadosCadastro) => Promise<ResultadoAuth>;
  sair: () => Promise<void>;
}

const Contexto = createContext<Sessao | null>(null);

export default function SessaoProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Uma única leitura de sessão para o app inteiro; o token fica no cookie httpOnly,
  // então quem responde quem está logado é o servidor.
  useEffect(() => {
    let vivo = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((p) => {
        if (!vivo) return;
        setUsuario((p?.data as Usuario) ?? null);
        setCarregando(false);
      })
      .catch(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  async function postar(rota: string, corpo: unknown, padrao: string): Promise<ResultadoAuth> {
    let res: Response;
    let payload: unknown;
    try {
      res = await fetch(rota, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      payload = await res.json();
    } catch {
      return { ok: false, erro: 'Não foi possível falar com o servidor.' };
    }

    if (!res.ok) return extrairErro(payload, padrao);

    setUsuario((payload as { data?: Usuario })?.data ?? null);
    return { ok: true };
  }

  const valor: Sessao = {
    usuario,
    carregando,
    entrar: (email, senha) =>
      postar('/api/auth/login', { email, password: senha }, 'Não foi possível entrar.'),
    cadastrar: (dados) =>
      postar(
        '/api/auth/register',
        {
          name: dados.nome,
          email: dados.email,
          phone: dados.telefone,
          password: dados.senha,
          password_confirmation: dados.confirmacao,
        },
        'Não foi possível criar a conta.'
      ),
    sair: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUsuario(null);
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSessao precisa estar dentro de <SessaoProvider>.');
  return ctx;
}

/** Atalho para quem só precisa saber quem está logado. */
export function useUsuario(): { usuario: Usuario | null; carregando: boolean } {
  const { usuario, carregando } = useSessao();
  return { usuario, carregando };
}

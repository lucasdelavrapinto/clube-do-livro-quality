'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Capa } from '@/components/AcervoGrid';
import { useUsuario } from '@/components/SessaoProvider';
import { devolverLivro, retirarLivro } from '@/lib/auth';
import type { Livro } from '@/lib/livros';

interface Props {
  livro: Livro | null;
  onClose: () => void;
  /** Este exemplar está com o usuário logado. */
  meu?: boolean;
  /** O usuário já atingiu o limite de livros em mãos. */
  bloqueadoPorLimite?: boolean;
  /** Chamado após retirada ou devolução, para o acervo recarregar. */
  onMudou?: () => void;
}

export default function LivroModal({
  livro,
  onClose,
  meu = false,
  bloqueadoPorLimite = false,
  onMudou,
}: Props) {
  useEffect(() => {
    if (!livro) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [livro, onClose]);

  if (!livro) return null;

  // A key por livro zera o estado da retirada ao abrir outro título.
  return (
    <Conteudo
      key={livro.id}
      livro={livro}
      onClose={onClose}
      meu={meu}
      bloqueadoPorLimite={bloqueadoPorLimite}
      onMudou={onMudou}
    />
  );
}

function Conteudo({
  livro,
  onClose,
  meu,
  bloqueadoPorLimite,
  onMudou,
}: {
  livro: Livro;
  onClose: () => void;
  meu: boolean;
  bloqueadoPorLimite: boolean;
  onMudou?: () => void;
}) {
  const { usuario, carregando } = useUsuario();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Quatro estados possíveis, um botão só.
  const acao: Acao = meu
    ? 'devolver'
    : !livro.disponivel
      ? 'indisponivel'
      : bloqueadoPorLimite
        ? 'limite'
        : 'retirar';

  async function handleAcao() {
    if (!usuario) {
      // Sem sessão: manda para o login, que volta ao acervo depois de entrar.
      router.push(`/login?next=${encodeURIComponent('/')}`);
      return;
    }

    setEnviando(true);
    setErro(null);
    const resultado =
      acao === 'devolver' ? await devolverLivro(livro.id) : await retirarLivro(livro.id);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível concluir a operação.');
      // O acervo pode ter mudado por baixo (outra pessoa retirou antes).
      onMudou?.();
      return;
    }

    onMudou?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col gap-5 p-6 sm:flex-row">
          <div className="w-32 shrink-0 self-center overflow-hidden rounded-xl sm:w-40 sm:self-start">
            <Capa livro={livro} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">{livro.titulo}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{livro.escritor}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 py-1 text-xl leading-none text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {livro.categoria && (
              <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {livro.categoria}
              </span>
            )}

            {livro.resumo && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{livro.resumo}</p>
            )}

            <dl className="mt-5 space-y-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <Info termo="Disponibilizado por" valor={livro.disponibilizado_por} />
              <Info termo="Cadastrado por" valor={livro.cadastrado_por} />
              <Info
                termo="No acervo desde"
                valor={new Date(livro.created_at).toLocaleDateString('pt-BR')}
              />
            </dl>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleAcao}
                disabled={enviando || carregando || acao === 'indisponivel' || acao === 'limite'}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  acao === 'devolver'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                {rotuloDoBotao(acao, enviando)}
              </button>
              {erro && <p className="mt-2 text-xs text-red-500">{erro}</p>}
              {acao === 'retirar' && !usuario && !carregando && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Você precisa entrar na sua conta para retirar.
                </p>
              )}
              {acao === 'devolver' && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Este exemplar está com você.
                </p>
              )}
              {acao === 'indisponivel' && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Este exemplar está com outro leitor no momento.
                </p>
              )}
              {acao === 'limite' && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Você já está com um livro. Devolva antes de retirar outro.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Acao = 'retirar' | 'devolver' | 'indisponivel' | 'limite';

function rotuloDoBotao(acao: Acao, enviando: boolean): string {
  if (acao === 'indisponivel') return 'Indisponível';
  if (acao === 'limite') return 'Retirar';
  if (acao === 'devolver') return enviando ? 'Devolvendo...' : 'Devolver';
  return enviando ? 'Retirando...' : 'Retirar';
}

function Info({ termo, valor }: { termo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-2">
      <dt>{termo}:</dt>
      <dd className="font-medium text-gray-700">{valor}</dd>
    </div>
  );
}

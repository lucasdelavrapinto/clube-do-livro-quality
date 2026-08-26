'use client';

import { useMemo } from 'react';
import type { Livro } from '@/lib/livros';

/**
 * Valor usado no lugar da categoria para os livros que não têm uma. Os sublinhados
 * evitam colisão com uma categoria real vinda da API.
 */
export const SEM_CATEGORIA = '__sem_categoria__';

interface Props {
  livros: Livro[];
  /** `null` = todas. */
  selecionada: string | null;
  onChange: (categoria: string | null) => void;
}

/** Uma categoria entra no filtro se algum livro carregado a usa. */
export default function CategoriaFiltro({ livros, selecionada, onChange }: Props) {
  const categorias = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const livro of livros) {
      const chave = livro.categoria ?? SEM_CATEGORIA;
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .map(([valor, total]) => ({ valor, total }))
      .sort((a, b) => {
        // "Sem categoria" fecha a lista; o resto em ordem alfabética.
        if (a.valor === SEM_CATEGORIA) return 1;
        if (b.valor === SEM_CATEGORIA) return -1;
        return a.valor.localeCompare(b.valor, 'pt-BR');
      });
  }, [livros]);

  // Com uma categoria só o filtro não separa nada.
  if (categorias.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Filtrar por categoria"
      // No celular a fila rola na horizontal; a partir de sm ela quebra em linhas,
      // porque com muitas categorias a rolagem esconde metade das opções.
      className="flex gap-2 overflow-x-auto border-b border-gray-100 px-6 py-3 sm:flex-wrap sm:overflow-x-visible"
    >
      <Chip ativo={selecionada === null} onClick={() => onChange(null)}>
        Todas
        <Contador ativo={selecionada === null}>{livros.length}</Contador>
      </Chip>

      {categorias.map(({ valor, total }) => {
        const ativo = selecionada === valor;
        return (
          <Chip key={valor} ativo={ativo} onClick={() => onChange(ativo ? null : valor)}>
            {valor === SEM_CATEGORIA ? 'Sem categoria' : valor}
            <Contador ativo={ativo}>{total}</Contador>
          </Chip>
        );
      })}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        ativo
          ? 'bg-amber-800 text-white'
          : 'border border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-900'
      }`}
    >
      {children}
    </button>
  );
}

function Contador({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return <span className={ativo ? 'text-amber-200' : 'text-gray-400'}>{children}</span>;
}

'use client';

import { useState } from 'react';
import type { Livro } from '@/lib/livros';

interface Props {
  livros: Livro[];
  /** Ids dos exemplares que estão com o usuário logado. */
  meusLivros?: Set<number>;
  onSelect: (livro: Livro) => void;
}

export default function AcervoGrid({ livros, meusLivros, onSelect }: Props) {
  if (livros.length === 0) {
    return (
      <p className="text-center text-gray-400 py-16 text-sm">
        Nenhum livro encontrado.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {livros.map((livro) => (
        <li key={livro.id} className="flex">
          <button
            type="button"
            onClick={() => onSelect(livro)}
            className="group flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <div className="relative">
              <Capa livro={livro} className={livro.disponivel ? '' : 'opacity-40'} />
              {!livro.disponivel && (
                <span
                  className={`absolute inset-x-0 bottom-0 py-1 text-center text-[11px] font-medium text-white ${
                    meusLivros?.has(livro.id) ? 'bg-amber-700/90' : 'bg-gray-900/75'
                  }`}
                >
                  {meusLivros?.has(livro.id) ? 'Com você' : 'Retirado'}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 px-3 py-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-amber-900">
                {livro.titulo}
              </h3>
              <p className="line-clamp-1 text-xs text-gray-500">{livro.escritor}</p>
              {livro.categoria && (
                <span className="mt-auto inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  {livro.categoria}
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Capa({ livro, className = '' }: { livro: Livro; className?: string }) {
  const [erro, setErro] = useState(false);

  if (!livro.imagem_url || erro) {
    return (
      <div
        className={`flex aspect-[2/3] w-full items-center justify-center bg-amber-50 ${className}`}
      >
        <span className="text-4xl font-bold text-amber-300">
          {livro.titulo.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // <img> em vez de next/image: a URL da capa vem da API e o host muda por ambiente.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={livro.imagem_url}
      alt={`Capa de ${livro.titulo}`}
      loading="lazy"
      onError={() => setErro(true)}
      className={`aspect-[2/3] w-full bg-gray-100 object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
    />
  );
}

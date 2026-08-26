'use client';

import { useEffect, useState } from 'react';
import AcervoGrid from '@/components/AcervoGrid';
import CategoriaFiltro, { SEM_CATEGORIA } from '@/components/CategoriaFiltro';
import LivroModal from '@/components/LivroModal';
import { useUsuario } from '@/components/SessaoProvider';
import { buscarMeusLivros } from '@/lib/auth';
import { normalizar, type Livro, type LivrosResponse } from '@/lib/livros';

/** Mesmo limite aplicado no servidor (`LivroController::LIMITE_POR_PESSOA`). */
const LIMITE_POR_PESSOA = 1;

export default function Home() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Livro | null>(null);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [meusLivros, setMeusLivros] = useState<Set<number>>(new Set());
  const { usuario } = useUsuario();

  async function fetchAcervo() {
    try {
      const res = await fetch('/api/livros');
      const payload: LivrosResponse = await res.json();
      if (payload.error) throw new Error(payload.error);
      setLivros(payload.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o acervo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAcervo();
  }, []);

  // Quem está com o quê depende da sessão: recarrega quando ela muda. Sem sessão a
  // rota devolve lista vazia sem sair do servidor, então não precisa de guarda aqui
  // — e assim o logout limpa o estado pelo mesmo caminho.
  useEffect(() => {
    buscarMeusLivros().then(setMeusLivros);
  }, [usuario]);

  /** Após retirar ou devolver, acervo e "meus livros" mudam juntos. */
  function atualizar() {
    fetchAcervo();
    buscarMeusLivros().then(setMeusLivros);
  }

  const termo = normalizar(search.trim());
  const livrosFiltrados = livros.filter((l) => {
    if (categoria !== null && (l.categoria ?? SEM_CATEGORIA) !== categoria) return false;
    if (!termo) return true;
    return [l.titulo, l.escritor, l.categoria, l.disponibilizado_por].some(
      (campo) => campo && normalizar(campo).includes(termo)
    );
  });

  return (
    <main className="flex-1 bg-gray-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="shrink-0">
              <h2 className="text-base font-semibold text-amber-900">Acervo</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Carregando...' : resumoAcervo(livros)}
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título, autor ou categoria..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:ml-auto sm:max-w-sm"
            />
          </div>

          {!loading && !error && (
            <CategoriaFiltro
              livros={livros}
              selecionada={categoria}
              onChange={setCategoria}
            />
          )}

          <div className="p-4 sm:p-6">
            {loading ? (
              <p className="py-12 text-center text-sm text-gray-400">Carregando...</p>
            ) : error ? (
              <p className="py-12 text-center text-sm text-red-500">{error}</p>
            ) : (
              <AcervoGrid
                livros={livrosFiltrados}
                meusLivros={meusLivros}
                onSelect={setSelecionado}
              />
            )}
          </div>
        </section>
      </div>

      <LivroModal
        livro={selecionado}
        onClose={() => setSelecionado(null)}
        meu={selecionado ? meusLivros.has(selecionado.id) : false}
        bloqueadoPorLimite={meusLivros.size >= LIMITE_POR_PESSOA}
        onMudou={atualizar}
      />
    </main>
  );
}

/** "2 de 3 livros disponíveis para retirada" — a contagem antiga somava tudo. */
function resumoAcervo(livros: Livro[]): string {
  const total = livros.length;
  const disponiveis = livros.filter((l) => l.disponivel).length;
  if (total === 0) return 'Nenhum livro no acervo';
  if (disponiveis === total) {
    return `${total} ${total === 1 ? 'livro disponível' : 'livros disponíveis'} para retirada`;
  }
  return `${disponiveis} de ${total} livros disponíveis para retirada`;
}

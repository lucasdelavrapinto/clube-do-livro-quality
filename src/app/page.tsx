'use client';

import { useEffect, useState } from 'react';
import BookTable from '@/components/BookTable';
import WithdrawModal from '@/components/WithdrawModal';
import ReturnModal from '@/components/ReturnModal';
import type { Book } from '@/lib/db';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingBook, setWithdrawingBook] = useState<Book | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);

  async function fetchBooks() {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar livros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBooks(); }, []);

  async function handleReturn(bookId: number) {
    await fetch('/api/devolucoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    });
    fetchBooks();
  }

  async function handleWithdraw(bookId: number, pessoa: string) {
    await fetch('/api/retiradas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, pessoa }),
    });
    fetchBooks();
  }

  const available = books.filter((b) => b.status === 'disponível').length;
  const unavailable = books.length - available;

  return (
    <main className="flex-1 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total" value={books.length} />
          <StatCard label="Disponíveis" value={available} color="bg-green-50" textColor="text-green-700" />
          <StatCard label="Indisponíveis" value={unavailable} color="bg-red-50" textColor="text-red-700" />
        </div>

        <section className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-amber-900">Acervo</h2>
          </div>
          {loading ? (
            <p className="text-center text-gray-400 py-12 text-sm">Carregando...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-12 text-sm">{error}</p>
          ) : (
            <BookTable books={books} onWithdraw={setWithdrawingBook} />
          )}
        </section>
      </div>

      {/* Botão flutuante */}
      <button
        onClick={() => setReturnOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-blue-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-800 active:scale-95 transition-all"
      >
        <span className="text-base leading-none">↩</span>
        Devolver livro
      </button>

      <WithdrawModal
        book={withdrawingBook}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawingBook(null)}
      />
      <ReturnModal
        open={returnOpen}
        unavailableBooks={books.filter((b) => b.status === 'indisponível')}
        onConfirm={handleReturn}
        onClose={() => setReturnOpen(false)}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  color = 'bg-gray-50',
  textColor = 'text-amber-900',
}: {
  label: string;
  value: number;
  color?: string;
  textColor?: string;
}) {
  return (
    <div className={`${color} rounded-2xl border border-gray-100 shadow-sm px-5 py-4`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
    </div>
  );
}

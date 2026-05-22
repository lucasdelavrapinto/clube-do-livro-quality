'use client';

import { useEffect, useState } from 'react';
import type { Book } from '@/lib/db';
import DeleteModal from '@/components/DeleteModal';

export default function ExcluirPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  async function fetchBooks() {
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(data);
    setLoading(false);
  }

  useEffect(() => { fetchBooks(); }, []);

  return (
    <main className="flex-1 bg-amber-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-red-800">Excluir livro</h2>
          <p className="text-sm text-gray-500 mt-1">
            Selecione o livro que deseja remover do acervo. A exclusão exige confirmação por senha.
          </p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          {loading ? (
            <p className="text-center text-gray-400 py-12 text-sm">Carregando...</p>
          ) : books.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhum livro cadastrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {books.map((book) => (
                <li key={book.id} className="flex items-center justify-between px-6 py-4 hover:bg-red-50/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{book.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.owner}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                      book.status === 'disponível'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {book.status}
                    </span>
                    <button
                      onClick={() => setDeletingBook(book)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DeleteModal
        book={deletingBook}
        onSuccess={fetchBooks}
        onClose={() => setDeletingBook(null)}
      />
    </main>
  );
}

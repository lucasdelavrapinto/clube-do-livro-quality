'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BookForm from '@/components/BookForm';
import type { Book } from '@/lib/db';

export default function CadastrarPage() {
  return (
    <Suspense>
      <CadastrarForm />
    </Suspense>
  );
}

function CadastrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/books`)
      .then((r) => r.json())
      .then((books: Book[]) => {
        const found = books.find((b) => b.id === Number(editId));
        setBook(found ?? null);
        setLoading(false);
      });
  }, [editId]);

  async function handleSubmit(data: { name: string; status: string; owner: string; descricao: string }) {
    if (editId) {
      await fetch(`/api/books/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    router.push('/');
  }

  const isEditing = !!editId;

  return (
    <main className="flex-1 bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-amber-900">
            {isEditing ? 'Editar livro' : 'Cadastrar livro'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Altere os dados e salve.' : 'Preencha os dados do livro para adicioná-lo ao acervo.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Carregando...</p>
          ) : (
            <BookForm
              initialData={book ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/')}
              submitLabel={isEditing ? 'Salvar alterações' : 'Cadastrar'}
            />
          )}
        </div>
      </div>
    </main>
  );
}

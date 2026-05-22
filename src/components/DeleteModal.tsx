'use client';

import { useState, useEffect, useRef } from 'react';
import type { Book } from '@/lib/db';

interface Props {
  book: Book | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function DeleteModal({ book, onSuccess, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (book) { setPassword(''); setError(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [book]);

  if (!book) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!book) return;
    setLoading(true);
    setError('');
    const bookId = book.id;

    const authRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!authRes.ok) {
      setLoading(false);
      setError('Senha incorreta.');
      setPassword('');
      inputRef.current?.focus();
      return;
    }

    const delRes = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
    setLoading(false);

    if (!delRes.ok) {
      setError('Erro ao excluir o livro. Tente novamente.');
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Excluir livro</h3>
        <p className="text-sm text-gray-500 mb-4">
          Tem certeza que deseja excluir{' '}
          <span className="font-medium text-red-700">{book.name}</span>?
          Esta ação não pode ser desfeita.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha de confirmação</label>
            <input
              ref={inputRef}
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Digite a senha"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Excluindo...' : 'Excluir livro'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

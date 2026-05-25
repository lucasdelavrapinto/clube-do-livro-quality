'use client';

import { useState } from 'react';
import type { Book } from '@/lib/db';

interface Props {
  book: Book | null;
  onConfirm: (bookId: number) => Promise<void>;
  onClose: () => void;
}

export default function WithdrawModal({ book, onConfirm, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!book) return null;

  async function handleConfirm() {
    setSubmitting(true);
    await onConfirm(book!.id);
    setSubmitting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Confirmar retirada</h3>
        <p className="text-sm text-gray-500 mb-6">
          Você deseja retirar o livro{' '}
          <span className="font-medium text-amber-800">{book.name}</span>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Confirmando...' : 'Confirmar retirada'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

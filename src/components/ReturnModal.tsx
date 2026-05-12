'use client';

import { useState, useEffect } from 'react';
import type { Book } from '@/lib/db';

interface Props {
  open: boolean;
  unavailableBooks: Book[];
  onConfirm: (bookId: number) => Promise<void>;
  onClose: () => void;
}

export default function ReturnModal({ open, unavailableBooks, onConfirm, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSelectedId('');
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    await onConfirm(Number(selectedId));
    setSubmitting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Devolver livro</h3>
        <p className="text-sm text-gray-500 mb-4">Selecione o livro que está sendo devolvido.</p>

        {unavailableBooks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum livro retirado no momento.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livro</label>
              <select
                required
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Selecione...</option>
                {unavailableBooks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !selectedId}
                className="flex-1 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Devolvendo...' : 'Confirmar devolução'}
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
        )}
      </div>
    </div>
  );
}

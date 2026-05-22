'use client';

import { useState, useEffect, useRef } from 'react';
import type { Book } from '@/lib/db';

interface Props {
  book: Book | null;
  onConfirm: (bookId: number, pessoa: string, telefone: string) => Promise<void>;
  onClose: () => void;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function WithdrawModal({ book, onConfirm, onClose }: Props) {
  const [pessoa, setPessoa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (book) { setPessoa(''); setTelefone(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [book]);

  if (!book) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pessoa.trim() || !telefone.trim()) return;
    setSubmitting(true);
    const digits = telefone.replace(/\D/g, '');
    await onConfirm(book!.id, pessoa, digits);
    setSubmitting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Retirar livro</h3>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-amber-800">{book.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
            <input
              ref={inputRef}
              required
              value={pessoa}
              onChange={(e) => setPessoa(e.target.value)}
              placeholder="Ex: Maria Souza"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              required
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(xx) xxxxx-xxxx"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Confirmando...' : 'Confirmar retirada'}
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

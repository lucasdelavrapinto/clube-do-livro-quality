'use client';

import { useState, useEffect } from 'react';
import type { Book } from '@/lib/db';

interface Props {
  initialData?: Book;
  onSubmit: (data: { name: string; status: string; owner: string }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function BookForm({ initialData, onSubmit, onCancel, submitLabel }: Props) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'disponível' | 'indisponível'>('disponível');
  const [owner, setOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStatus(initialData.status);
      setOwner(initialData.owner);
    } else {
      setName('');
      setStatus('disponível');
      setOwner('');
    }
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ name, status, owner });
    setSubmitting(false);
  }

  const label = submitLabel ?? (initialData ? 'Salvar' : 'Cadastrar');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do livro</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Dom Casmurro"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proprietário</label>
          <input
            required
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Ex: João Silva"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'disponível' | 'indisponível')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="disponível">Disponível</option>
            <option value="indisponível">Indisponível</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-amber-700 px-6 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Salvando...' : label}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

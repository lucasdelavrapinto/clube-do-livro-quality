'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SugestaoModal({ open, onClose }: Props) {
  const [livro, setLivro] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLivro('');
      setSuccess(false);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/sugestoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livro }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Erro ao enviar sugestão.');
      return;
    }

    setSuccess(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Sugerir livro</h3>

        {success ? (
          <div className="py-4 text-center space-y-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Sugestão enviada! Obrigado pela indicação.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Qual livro você gostaria de ver no acervo?
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do livro</label>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  value={livro}
                  onChange={(e) => { setLivro(e.target.value); setError(''); }}
                  placeholder="Ex: O Senhor dos Anéis"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Sugerir livro'}
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
          </>
        )}
      </div>
    </div>
  );
}

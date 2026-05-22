'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

const SESSION_KEY = 'admin_auth';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true);
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setPassword('');
      inputRef.current?.focus();
    }
  }

  return (
    <main className="flex-1 bg-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900">Área restrita</h2>
          <p className="text-sm text-gray-500 mt-1">Digite a senha para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Senha"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">Senha incorreta. Tente novamente.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}

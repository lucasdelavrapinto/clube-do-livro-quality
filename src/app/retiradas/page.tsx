'use client';

import { useEffect, useState } from 'react';
import type { Retirada } from '@/lib/db';

export default function RetiradasPage() {
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/retiradas')
      .then((r) => r.json())
      .then((data) => { setRetiradas(data); setLoading(false); });
  }, []);

  return (
    <main className="flex-1 bg-amber-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <StatCard label="Total de retiradas" value={retiradas.length} />
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100">
            <h2 className="text-base font-semibold text-amber-900">Histórico de retiradas</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-12 text-sm">Carregando...</p>
          ) : retiradas.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhuma retirada registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-amber-900 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Livro</th>
                    <th className="px-6 py-3 font-medium">Pessoa</th>
                    <th className="px-6 py-3 font-medium">Retirado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {retiradas.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{r.book_name}</td>
                      <td className="px-6 py-4 text-gray-600">{r.pessoa}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(r.retirado_em).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-5 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1 text-amber-900">{value}</p>
    </div>
  );
}

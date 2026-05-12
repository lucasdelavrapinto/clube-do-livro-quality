'use client';

import { useEffect, useState } from 'react';
import type { Devolucao } from '@/lib/db';

export default function DevolucoesPage() {
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/devolucoes')
      .then((r) => r.json())
      .then((data) => { setDevolucoes(data); setLoading(false); });
  }, []);

  return (
    <main className="flex-1 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:w-1/3">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-sm text-gray-500">Total de devoluções</p>
            <p className="text-3xl font-bold mt-1 text-gray-800">{devolucoes.length}</p>
          </div>
        </div>

        <section className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Histórico de devoluções</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-12 text-sm">Carregando...</p>
          ) : devolucoes.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhuma devolução registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Livro</th>
                    <th className="px-6 py-3 font-medium">Devolvido em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devolucoes.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{d.book_name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(d.devolvido_em).toLocaleString('pt-BR')}
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

'use client';

import type { Book } from '@/lib/db';

interface Props {
  books: Book[];
  onWithdraw?: (book: Book) => void;
}

export default function BookTable({ books, onWithdraw }: Props) {
  if (books.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Nenhum livro cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 text-left">
          <tr>
            <th className="px-6 py-3 font-medium">Livro</th>
            <th className="px-6 py-3 font-medium">Status</th>
            {onWithdraw && <th className="px-6 py-3 font-medium sr-only">Ação</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {books.map((book) => (
            <tr key={book.id} className="hover:bg-amber-50/40 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">{book.name}</td>
              <td className="px-6 py-4">
                <StatusBadge status={book.status} />
              </td>
              {onWithdraw && (
                <td className="px-6 py-4 text-right">
                  {book.status === 'disponível' && (
                    <button
                      onClick={() => onWithdraw(book)}
                      className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors"
                    >
                      Retirar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isAvailable = status === 'disponível';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
      {status}
    </span>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Book, type Retirada } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const retiradas = db.prepare(`
    SELECT r.*, b.name AS book_name
    FROM retiradas r
    JOIN books b ON b.id = r.book_id
    ORDER BY r.retirado_em DESC
  `).all() as Retirada[];
  return NextResponse.json(retiradas);
}

export async function POST(req: NextRequest) {
  const { book_id, pessoa } = await req.json();

  if (!book_id || !pessoa?.trim()) {
    return NextResponse.json({ error: 'book_id e pessoa são obrigatórios.' }, { status: 400 });
  }

  const db = getDb();
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id) as Book | undefined;

  if (!book) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }
  if (book.status === 'indisponível') {
    return NextResponse.json({ error: 'Livro já está indisponível.' }, { status: 409 });
  }

  const withdraw = db.transaction(() => {
    db.prepare('UPDATE books SET status = ? WHERE id = ?').run('indisponível', book_id);
    const result = db.prepare('INSERT INTO retiradas (book_id, pessoa) VALUES (?, ?)').run(book_id, pessoa.trim());
    return db.prepare('SELECT r.*, b.name AS book_name FROM retiradas r JOIN books b ON b.id = r.book_id WHERE r.id = ?').get(result.lastInsertRowid);
  });

  const retirada = withdraw();
  return NextResponse.json(retirada, { status: 201 });
}

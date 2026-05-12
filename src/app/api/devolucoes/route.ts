import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Book, type Devolucao } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const devolucoes = db.prepare(`
    SELECT d.*, b.name AS book_name
    FROM devolucoes d
    JOIN books b ON b.id = d.book_id
    ORDER BY d.devolvido_em DESC
  `).all() as Devolucao[];
  return NextResponse.json(devolucoes);
}

export async function POST(req: NextRequest) {
  const { book_id } = await req.json();

  if (!book_id) {
    return NextResponse.json({ error: 'book_id é obrigatório.' }, { status: 400 });
  }

  const db = getDb();
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id) as Book | undefined;

  if (!book) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }
  if (book.status === 'disponível') {
    return NextResponse.json({ error: 'Livro já está disponível.' }, { status: 409 });
  }

  const devolver = db.transaction(() => {
    db.prepare('UPDATE books SET status = ? WHERE id = ?').run('disponível', book_id);
    const result = db.prepare('INSERT INTO devolucoes (book_id) VALUES (?)').run(book_id);
    return db.prepare(`
      SELECT d.*, b.name AS book_name
      FROM devolucoes d JOIN books b ON b.id = d.book_id
      WHERE d.id = ?
    `).get(result.lastInsertRowid);
  });

  const devolucao = devolver();
  return NextResponse.json(devolucao, { status: 201 });
}

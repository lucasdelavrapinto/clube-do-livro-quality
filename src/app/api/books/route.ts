import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Book } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all() as Book[];
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const { name, status, owner } = await req.json();

  if (!name?.trim() || !owner?.trim()) {
    return NextResponse.json({ error: 'Nome e proprietário são obrigatórios.' }, { status: 400 });
  }
  if (status !== 'disponível' && status !== 'indisponível') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare('INSERT INTO books (name, status, owner) VALUES (?, ?, ?)')
    .run(name.trim(), status, owner.trim());

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid) as Book;
  return NextResponse.json(book, { status: 201 });
}

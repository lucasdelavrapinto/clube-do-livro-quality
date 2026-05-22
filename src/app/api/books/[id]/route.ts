import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Book } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }

  const name = body.name?.trim() ?? existing.name;
  const status = body.status ?? existing.status;
  const owner = body.owner?.trim() ?? existing.owner;
  const descricao = body.descricao !== undefined ? body.descricao.trim() : existing.descricao;

  if (!name || !owner) {
    return NextResponse.json({ error: 'Nome e proprietário são obrigatórios.' }, { status: 400 });
  }
  if (status !== 'disponível' && status !== 'indisponível') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  db.prepare('UPDATE books SET name = ?, status = ?, owner = ?, descricao = ? WHERE id = ?').run(name, status, owner, descricao, id);
  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book;
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

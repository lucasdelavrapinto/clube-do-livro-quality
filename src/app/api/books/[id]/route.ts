import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Book } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data: existing, error: fetchError } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }

  const book = existing as Book;
  const name = body.name?.trim() ?? book.name;
  const status = body.status ?? book.status;
  const owner = body.owner?.trim() ?? book.owner;
  const descricao = body.descricao !== undefined ? body.descricao.trim() : book.descricao;

  if (!name || !owner) {
    return NextResponse.json({ error: 'Nome e proprietário são obrigatórios.' }, { status: 400 });
  }
  if (status !== 'disponível' && status !== 'indisponível') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('books')
    .update({ name, status, owner, descricao })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data as Book);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error, count } = await supabase
    .from('books')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

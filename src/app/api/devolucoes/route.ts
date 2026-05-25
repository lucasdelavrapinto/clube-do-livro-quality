import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Book, type Devolucao } from '@/lib/db';
import { getSessionUser } from '@/lib/supabase-server';

export async function GET() {
  const { data, error } = await supabase
    .from('devolucoes')
    .select('*, books!inner(name)')
    .order('devolvido_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const devolucoes = (data ?? []).map((d) => ({
    ...d,
    book_name: (d.books as { name: string } | null)?.name,
    books: undefined,
  })) as Devolucao[];

  return NextResponse.json(devolucoes);
}

export async function POST(req: NextRequest) {
  const { book_id } = await req.json();

  if (!book_id) {
    return NextResponse.json({ error: 'book_id é obrigatório.' }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', book_id)
    .single();

  if (bookError || !bookData) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }

  const book = bookData as Book;
  if (book.status === 'disponível') {
    return NextResponse.json({ error: 'Livro já está disponível.' }, { status: 409 });
  }

  // Verifica se a última retirada do livro foi feita pelo usuário atual
  const { data: lastRetirada, error: retiradaError } = await supabase
    .from('retiradas')
    .select('user_id')
    .eq('book_id', book_id)
    .order('retirado_em', { ascending: false })
    .limit(1)
    .single();

  if (retiradaError || !lastRetirada) {
    return NextResponse.json({ error: 'Nenhuma retirada encontrada para este livro.' }, { status: 404 });
  }

  if (lastRetirada.user_id !== user.id) {
    return NextResponse.json({ error: 'Você não retirou este livro.' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('books')
    .update({ status: 'disponível' })
    .eq('id', book_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: devolucaoData, error: insertError } = await supabase
    .from('devolucoes')
    .insert({ book_id })
    .select('*, books!inner(name)')
    .single();

  if (insertError) {
    await supabase.from('books').update({ status: 'indisponível' }).eq('id', book_id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const devolucao: Devolucao = {
    ...devolucaoData,
    book_name: (devolucaoData.books as { name: string } | null)?.name,
    books: undefined,
  };

  return NextResponse.json(devolucao, { status: 201 });
}

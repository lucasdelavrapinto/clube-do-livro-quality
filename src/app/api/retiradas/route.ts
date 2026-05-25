import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Book, type Retirada } from '@/lib/db';
import { getSessionUser } from '@/lib/supabase-server';
import { sendWhatsApp } from '@/lib/zapi';

export async function GET() {
  const { data, error } = await supabase
    .from('retiradas')
    .select('*, books!inner(name)')
    .order('retirado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const retiradas = (data ?? []).map((r) => ({
    ...r,
    book_name: (r.books as { name: string } | null)?.name,
    books: undefined,
  })) as Retirada[];

  return NextResponse.json(retiradas);
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

  const pessoa = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || 'Desconhecido';
  const telefone = (user.user_metadata?.telefone as string | undefined) ?? '';

  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', book_id)
    .single();

  if (bookError || !bookData) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 });
  }

  const book = bookData as Book;
  if (book.status === 'indisponível') {
    return NextResponse.json({ error: 'Livro já está indisponível.' }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from('books')
    .update({ status: 'indisponível' })
    .eq('id', book_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: retiradaData, error: insertError } = await supabase
    .from('retiradas')
    .insert({ book_id, user_id: user.id, pessoa, telefone })
    .select('*, books!inner(name)')
    .single();

  if (insertError) {
    await supabase.from('books').update({ status: 'disponível' }).eq('id', book_id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const retirada: Retirada = {
    ...retiradaData,
    book_name: (retiradaData.books as { name: string } | null)?.name,
    books: undefined,
  };

  // Notificação WhatsApp — não bloqueia a resposta em caso de falha
  if (telefone) {
    const nome = pessoa.split(' ')[0];
    sendWhatsApp(
      telefone,
      `Olá, ${nome}! Você retirou o livro *${retirada.book_name}* do Clube do Livro Quality. Boa leitura! 📚`
    );
  }

  return NextResponse.json(retirada, { status: 201 });
}

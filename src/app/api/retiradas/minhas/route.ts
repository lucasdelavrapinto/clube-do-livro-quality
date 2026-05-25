import { NextResponse } from 'next/server';
import { supabase, type Book } from '@/lib/db';
import { getSessionUser } from '@/lib/supabase-server';

// Retorna os livros indisponíveis que o usuário autenticado retirou
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('retiradas')
    .select('book_id, retirado_em, books!inner(id, name, status, owner, descricao, created_at)')
    .eq('user_id', user.id)
    .order('retirado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplica por book_id e mantém apenas os que ainda estão indisponíveis
  const seen = new Set<number>();
  const myBooks: Book[] = [];
  for (const r of data ?? []) {
    const book = r.books as unknown as Book;
    if (!seen.has(r.book_id) && book.status === 'indisponível') {
      seen.add(r.book_id);
      myBooks.push(book);
    }
  }

  return NextResponse.json(myBooks);
}

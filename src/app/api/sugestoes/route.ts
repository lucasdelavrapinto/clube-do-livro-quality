import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Sugestao } from '@/lib/db';
import { getSessionUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { livro } = await req.json();

  if (!livro?.trim()) {
    return NextResponse.json({ error: 'Nome do livro é obrigatório.' }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const pessoa = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || 'Desconhecido';

  const { data, error } = await supabase
    .from('sugestoes')
    .insert({ user_id: user.id, pessoa, livro: livro.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data as Sugestao, { status: 201 });
}

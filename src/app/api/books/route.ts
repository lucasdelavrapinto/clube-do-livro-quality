import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Book } from '@/lib/db';

export async function GET() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data as Book[]);
}

export async function POST(req: NextRequest) {
  const { name, status, owner, descricao } = await req.json();

  if (!name?.trim() || !owner?.trim()) {
    return NextResponse.json({ error: 'Nome e proprietário são obrigatórios.' }, { status: 400 });
  }
  if (status !== 'disponível' && status !== 'indisponível') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('books')
    .insert({ name: name.trim(), status, owner: owner.trim(), descricao: descricao?.trim() ?? '' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data as Book, { status: 201 });
}

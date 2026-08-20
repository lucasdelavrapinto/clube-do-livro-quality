import { NextRequest } from 'next/server';
import { acaoNoLivro } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const { livro_id } = await req.json();
  return acaoNoLivro(livro_id, 'retirada');
}

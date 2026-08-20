import { NextResponse } from 'next/server';
import { API_V1_URL, falhaUpstream, lerToken } from '@/lib/auth-server';

/** Exemplares que estão com o usuário da sessão. Sem sessão devolve lista vazia. */
export async function GET() {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ data: [], meta: { total: 0 }, error: null });
  }

  try {
    const upstream = await fetch(`${API_V1_URL}/minhas-retiradas`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json({ data: [], meta: { total: 0 }, error: null });
    }
    return NextResponse.json(await upstream.json());
  } catch {
    return falhaUpstream('Não foi possível carregar suas retiradas.');
  }
}

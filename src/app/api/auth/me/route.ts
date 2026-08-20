import { NextResponse } from 'next/server';
import { apagarToken, falhaUpstream, lerToken, urlAuth } from '@/lib/auth-server';

function semSessao() {
  const res = NextResponse.json({ data: null, meta: null, error: null }, { status: 200 });
  apagarToken(res); // token inválido ou expirado — não adianta guardar
  return res;
}

export async function GET() {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ data: null, meta: null, error: null });
  }

  try {
    const upstream = await fetch(urlAuth('me'), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!upstream.ok) return semSessao();

    const payload = await upstream.json();
    return NextResponse.json({ data: payload?.data ?? null, meta: null, error: null });
  } catch {
    return falhaUpstream('Não foi possível validar a sessão.');
  }
}

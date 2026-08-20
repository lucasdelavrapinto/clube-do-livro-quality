import { NextResponse } from 'next/server';
import { apagarToken, lerToken, urlAuth } from '@/lib/auth-server';

export async function POST() {
  const token = await lerToken();

  // Revoga o token no servidor, mas a sessão local cai de qualquer jeito.
  if (token) {
    try {
      await fetch(urlAuth('logout'), {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {
      // silencioso de propósito — ver comentário acima
    }
  }

  const res = NextResponse.json({ data: null, meta: null, error: null });
  apagarToken(res);
  return res;
}

import { NextRequest, NextResponse } from 'next/server';
import type { Livro, LivrosResponse } from '@/lib/livros';

const LIVROS_API_URL = process.env.LIVROS_API_URL ?? 'http://127.0.0.1:8001/api/livros';

const FILTROS = ['search', 'categoria', 'per_page', 'page'] as const;

function falha(mensagem: string): NextResponse<LivrosResponse> {
  return NextResponse.json(
    { data: [], meta: { total: 0 }, error: mensagem },
    { status: 502 }
  );
}

/**
 * Proxy do acervo. Passa pelo servidor em vez de o browser chamar a API direto:
 * evita CORS e mixed content, e mantém a URL da API (que muda por ambiente)
 * fora do bundle do cliente.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(LIVROS_API_URL);
    for (const filtro of FILTROS) {
      const valor = req.nextUrl.searchParams.get(filtro);
      if (valor) url.searchParams.set(filtro, valor);
    }

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Sem cache aqui: `disponivel` muda a cada retirada, e uma camada extra de
      // 60s mostraria livro já retirado como disponível. O upstream cacheia com
      // versionamento (`Livro::versaoCache()`), então ele já invalida sozinho.
      cache: 'no-store',
    });

    if (!res.ok) return falha(`A API de livros respondeu ${res.status}.`);

    const payload = await res.json();
    if (payload?.error) return falha(String(payload.error));

    return NextResponse.json({
      data: (payload?.data ?? []) as Livro[],
      meta: payload?.meta ?? { total: 0 },
      error: null,
    } satisfies LivrosResponse);
  } catch {
    return falha('Não foi possível conectar à API de livros.');
  }
}

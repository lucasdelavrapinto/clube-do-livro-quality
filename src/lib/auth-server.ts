import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const API_V1_URL = (process.env.API_V1_URL ?? 'http://127.0.0.1:8001/api/v1').replace(/\/$/, '');

export const COOKIE_TOKEN = 'clube_token';

const SETE_DIAS = 60 * 60 * 24 * 7;

/** Envelope padrão da API do Sistema-Quality. */
export interface EnvelopeApi {
  data: unknown;
  meta: unknown;
  error: { code?: string; message?: string; fields?: Record<string, string[]> } | null;
}

export function urlAuth(caminho: string): string {
  return `${API_V1_URL}/auth/${caminho}`;
}

export async function lerToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE_TOKEN)?.value;
}

/** Segundos até `expires_at`, com folga mínima e teto de uma semana. */
function maxAgeDe(expiresAt: unknown): number {
  if (typeof expiresAt !== 'string') return SETE_DIAS;
  const restante = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  if (!Number.isFinite(restante) || restante <= 0) return SETE_DIAS;
  return Math.min(restante, SETE_DIAS);
}

export function gravarToken(res: NextResponse, token: string, expiresAt: unknown): void {
  res.cookies.set(COOKIE_TOKEN, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeDe(expiresAt),
  });
}

export function apagarToken(res: NextResponse): void {
  res.cookies.set(COOKIE_TOKEN, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function falhaUpstream(mensagem: string): NextResponse {
  return NextResponse.json(
    { data: null, meta: null, error: { code: 'UPSTREAM_ERROR', message: mensagem } },
    { status: 502 }
  );
}

/**
 * Repassa credenciais para `register` ou `login` e, em caso de sucesso, guarda o
 * token no cookie httpOnly. O token nunca chega ao JavaScript da página.
 */
export async function autenticar(caminho: 'login' | 'register', corpo: unknown) {
  let upstream: Response;
  let payload: EnvelopeApi;

  try {
    upstream = await fetch(urlAuth(caminho), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo),
      cache: 'no-store',
    });
    payload = (await upstream.json()) as EnvelopeApi;
  } catch {
    return falhaUpstream('Não foi possível falar com o servidor de autenticação.');
  }

  const dados = payload.data as
    | { token?: string; expires_at?: string; user?: unknown }
    | null;

  if (!upstream.ok || !dados?.token) {
    // Repassa o erro de validação da API como veio, preservando `fields`.
    return NextResponse.json(payload, { status: upstream.status || 502 });
  }

  const res = NextResponse.json({ data: dados.user, meta: null, error: null });
  gravarToken(res, dados.token, dados.expires_at);
  return res;
}

/**
 * Retirada e devolução só diferem no verbo final da URL, então dividem o mesmo
 * caminho: valida o id, anexa o Bearer do cookie e repassa a resposta como veio
 * — inclusive os 409 (`LIVRO_INDISPONIVEL` e `RETIRADA_NAO_ENCONTRADA`).
 */
export async function acaoNoLivro(livroId: unknown, acao: 'retirada' | 'devolucao') {
  // Validação estrita: este id é interpolado na URL do upstream.
  if (!Number.isInteger(livroId) || (livroId as number) <= 0) {
    return NextResponse.json(
      { data: null, meta: null, error: { code: 'LIVRO_INVALIDO', message: 'Livro inválido.' } },
      { status: 400 }
    );
  }

  const token = await lerToken();
  if (!token) {
    return NextResponse.json(
      {
        data: null,
        meta: null,
        error: { code: 'NAO_AUTENTICADO', message: 'Entre na sua conta para continuar.' },
      },
      { status: 401 }
    );
  }

  try {
    const upstream = await fetch(`${API_V1_URL}/livros/${livroId}/${acao}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
      cache: 'no-store',
    });

    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return falhaUpstream('Não foi possível falar com o servidor.');
  }
}

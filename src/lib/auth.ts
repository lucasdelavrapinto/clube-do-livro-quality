export interface Usuario {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
}

export interface DadosCadastro {
  nome: string;
  telefone: string; // com ou sem máscara — o servidor normaliza
  email: string;
  senha: string;
  confirmacao: string;
}

export interface ResultadoAuth {
  ok: boolean;
  erro?: string;
  /** Erros por campo, como vêm em `error.fields` da API. */
  campos?: Record<string, string[]>;
}

/** Traduz o envelope de erro da API para o formato que as telas consomem. */
export function extrairErro(payload: unknown, padrao: string): ResultadoAuth {
  const erro = (payload as { error?: { message?: string; fields?: Record<string, string[]> } })
    ?.error;
  return {
    ok: false,
    erro: erro?.message ?? padrao,
    campos: erro?.fields,
  };
}

async function acaoNoLivro(
  rota: string,
  livroId: number,
  padrao: string
): Promise<ResultadoAuth> {
  let res: Response;
  let payload: unknown;

  try {
    res = await fetch(rota, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livro_id: livroId }),
    });
    payload = await res.json();
  } catch {
    return { ok: false, erro: 'Não foi possível falar com o servidor.' };
  }

  if (!res.ok) return extrairErro(payload, padrao);
  return { ok: true };
}

/** Registra a retirada do exemplar para o usuário da sessão atual. */
export function retirarLivro(livroId: number): Promise<ResultadoAuth> {
  return acaoNoLivro('/api/retiradas', livroId, 'Não foi possível concluir a retirada.');
}

/** Devolve o exemplar. O servidor recusa se ele não estiver com quem pediu. */
export function devolverLivro(livroId: number): Promise<ResultadoAuth> {
  return acaoNoLivro('/api/devolucoes', livroId, 'Não foi possível concluir a devolução.');
}

/** Ids dos livros que estão com o usuário agora. Lista vazia quando não há sessão. */
export async function buscarMeusLivros(): Promise<Set<number>> {
  try {
    const res = await fetch('/api/minhas-retiradas');
    const payload = await res.json();
    const linhas = (payload?.data ?? []) as { livro?: { id?: number } }[];
    return new Set(
      linhas.map((l) => l.livro?.id).filter((id): id is number => typeof id === 'number')
    );
  } catch {
    return new Set();
  }
}

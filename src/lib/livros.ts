/** Livro do acervo, como vem da API pública `GET /api/livros`. */
export interface Livro {
  id: number;
  titulo: string;
  escritor: string;
  categoria: string | null;
  disponivel: boolean;
  disponibilizado_por: string;
  resumo: string | null;
  imagem_url: string | null;
  cadastrado_por: string | null;
  created_at: string;
}

export interface LivrosMeta {
  total: number;
  page?: number;
  per_page?: number;
  last_page?: number;
}

export interface LivrosResponse {
  data: Livro[];
  meta: LivrosMeta;
  error: string | null;
}

/** Remove acentos para que a busca por "financas" também encontre "Finanças". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

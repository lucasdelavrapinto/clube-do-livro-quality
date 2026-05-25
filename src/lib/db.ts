import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type BookStatus = 'disponível' | 'indisponível';

export interface Book {
  id: number;
  name: string;
  status: BookStatus;
  owner: string;
  descricao: string;
  created_at: string;
}

export interface Retirada {
  id: number;
  book_id: number;
  user_id?: string;
  pessoa: string;
  telefone: string;
  retirado_em: string;
  book_name?: string;
}

export interface Devolucao {
  id: number;
  book_id: number;
  devolvido_em: string;
  book_name?: string;
}

export interface Sugestao {
  id: number;
  user_id?: string;
  pessoa: string;
  livro: string;
  sugerido_em: string;
}

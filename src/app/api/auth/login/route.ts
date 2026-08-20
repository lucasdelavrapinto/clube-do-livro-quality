import { NextRequest } from 'next/server';
import { autenticar } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  return autenticar('login', { email, password });
}

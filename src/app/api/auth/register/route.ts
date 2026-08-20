import { NextRequest } from 'next/server';
import { autenticar } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const { name, email, phone, password, password_confirmation } = await req.json();
  return autenticar('register', { name, email, phone, password, password_confirmation });
}

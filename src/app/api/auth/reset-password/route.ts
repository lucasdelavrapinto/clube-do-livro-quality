import { NextRequest } from 'next/server';
import { repassar } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const { token, email, password, password_confirmation } = await req.json();
  return repassar('reset-password', { token, email, password, password_confirmation });
}

import { NextRequest } from 'next/server';
import { repassar } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  return repassar('forgot-password', { email });
}

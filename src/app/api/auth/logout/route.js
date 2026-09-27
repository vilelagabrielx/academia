import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('gym_session');
  return response;
}

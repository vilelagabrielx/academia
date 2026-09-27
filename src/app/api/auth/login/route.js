import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username e senha são obrigatórios' }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique o usuário e senha.' }, { status: 401 });
    }

    const token = signToken(user);
    const response = NextResponse.json({ success: true, user });

    response.cookies.set('gym_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 365 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao realizar login' }, { status: 500 });
  }
}

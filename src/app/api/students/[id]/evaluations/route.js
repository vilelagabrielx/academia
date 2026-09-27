import { NextResponse } from 'next/server';
import { addBodyEvaluation } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const result = await addBodyEvaluation(id, body, user.email || user.username || 'Sistema');
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error adding body evaluation:', error);
    return NextResponse.json({ error: 'Erro ao registrar avaliação' }, { status: 500 });
  }
}

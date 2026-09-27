import { NextResponse } from 'next/server';
import { getStudentCompleteHistory } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const historyData = await getStudentCompleteHistory(id);
    return NextResponse.json({ ...historyData });
  } catch (error) {
    console.error('Error fetching student history:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico do aluno' }, { status: 500 });
  }
}


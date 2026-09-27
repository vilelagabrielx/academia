import { NextResponse } from 'next/server';
import { cancelStudentEnrollment } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    await cancelStudentEnrollment(id);
    return NextResponse.json({ success: true, message: 'Matrícula e próximas mensalidades canceladas com sucesso' });
  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    return NextResponse.json({ error: error.message || 'Erro ao cancelar matrícula' }, { status: 500 });
  }
}

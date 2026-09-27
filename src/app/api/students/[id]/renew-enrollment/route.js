import { NextResponse } from 'next/server';
import { renewStudentEnrollment } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const amount = body.amount || 60.00;
    const startDate = body.startDate || null;

    const result = await renewStudentEnrollment(id, { amount, startDate });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error renewing enrollment:', error);
    return NextResponse.json({ error: error.message || 'Erro ao renovar matrícula' }, { status: 500 });
  }
}

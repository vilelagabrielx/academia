import { NextResponse } from 'next/server';
import { convertToMonthly } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const createNextMonth = body.createNextMonth !== false;

    const result = await convertToMonthly(id, { createNextMonth });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error converting billing to monthly:', error);
    return NextResponse.json({ error: error.message || 'Erro ao transformar em mensalidade' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getBillings, getBillingSummary, createBilling } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;
    const userId = searchParams.get('user_id') || null;
    const search = searchParams.get('search') || '';

    const summary = await getBillingSummary();
    const billings = await getBillings({ status, user_id: userId, search });

    return NextResponse.json({ summary, billings });
  } catch (error) {
    console.error('Error fetching billings:', error);
    return NextResponse.json({ error: 'Erro ao buscar cobranças' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.user_id || !data.amount || !data.due_date) {
      return NextResponse.json({ error: 'Aluno, valor e data de vencimento são obrigatórios' }, { status: 400 });
    }

    const result = await createBilling(data);
    if (result.duplicate) {
      return NextResponse.json({
        duplicate: true,
        existingBilling: result.existingBilling,
        error: result.error || 'Já existe uma cobrança para este aluno no período informado.',
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error creating billing:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar cobrança' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { markExpenseAsPaid } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const updated = await markExpenseAsPaid(id, data);
    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error('Error marking expense as paid:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento da despesa' }, { status: 500 });
  }
}

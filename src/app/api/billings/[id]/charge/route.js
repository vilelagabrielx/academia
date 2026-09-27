import { NextResponse } from 'next/server';
import { markBillingAsCharged } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { remind_days, remind_at, charge_notes } = await request.json();

    const updated = await markBillingAsCharged(id, { remind_days, remind_at, charge_notes });
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error marking billing as charged:', error);
    return NextResponse.json({ error: 'Erro ao marcar cobrança efetuada' }, { status: 500 });
  }
}

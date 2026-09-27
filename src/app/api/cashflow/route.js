import { NextResponse } from 'next/server';
import { getCashFlowSummary } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get('month_year') || null;

    const cashflow = await getCashFlowSummary({ month_year: monthYear });
    return NextResponse.json({ success: true, cashflow });
  } catch (error) {
    console.error('Error fetching cashflow:', error);
    return NextResponse.json({ error: 'Erro ao calcular fluxo de caixa' }, { status: 500 });
  }
}

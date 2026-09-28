import { NextResponse } from 'next/server';
import { getExpenses, getExpenseSummary, createExpense } from '@/lib/db';
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
    const category = searchParams.get('category') || null;
    const search = searchParams.get('search') || '';
    const monthYear = searchParams.get('month_year') || null;

    const [summary, expenses] = await Promise.all([
      getExpenseSummary({ month_year: monthYear, search, category }),
      getExpenses({ status, category, search, month_year: monthYear })
    ]);

    return NextResponse.json({ summary, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Erro ao buscar despesas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.description || !data.amount || !data.due_date) {
      return NextResponse.json({ error: 'Descrição, valor e data de vencimento são obrigatórios' }, { status: 400 });
    }

    const result = await createExpense(data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar despesa' }, { status: 500 });
  }
}

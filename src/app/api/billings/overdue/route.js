import { NextResponse } from 'next/server';
import { getOverdueBillings } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const overdue = await getOverdueBillings();
    return NextResponse.json({ overdue });
  } catch (error) {
    console.error('Error fetching overdue billings:', error);
    return NextResponse.json({ error: 'Erro ao buscar cobranças atrasadas' }, { status: 500 });
  }
}

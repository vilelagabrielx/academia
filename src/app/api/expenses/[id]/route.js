import { NextResponse } from 'next/server';
import { updateExpense, deleteExpense } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const result = await updateExpense(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar despesa' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const deleteRecurrence = searchParams.get('delete_recurrence') === 'true';

    await deleteExpense(id, { delete_recurrence: deleteRecurrence });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { updateBillingStatus, deleteBilling } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const updated = await updateBillingStatus(id, data);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cobrança' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    await deleteBilling(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting billing:', error);
    return NextResponse.json({ error: 'Erro ao excluir cobrança' }, { status: 500 });
  }
}

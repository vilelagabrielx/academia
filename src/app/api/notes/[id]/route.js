import { NextResponse } from 'next/server';
import { updateQuickNote, deleteQuickNote } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const note = await updateQuickNote(id, body);
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error updating quick note:', error);
    return NextResponse.json({ error: 'Erro ao atualizar anotação' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    await deleteQuickNote(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick note:', error);
    return NextResponse.json({ error: 'Erro ao excluir anotação' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getRoutineFullDetail, query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const routine = await getRoutineFullDetail(id);
    if (!routine) {
      return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ routine });
  } catch (error) {
    console.error('Error fetching routine detail:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes do treino' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    await query(`DELETE FROM manager_routine WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json({ error: 'Erro ao excluir treino' }, { status: 500 });
  }
}

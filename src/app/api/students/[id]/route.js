import { NextResponse } from 'next/server';
import { updateStudent, deleteStudent } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const result = await updateStudent(id, data);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Erro ao atualizar aluno' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    await deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Erro ao excluir aluno' }, { status: 500 });
  }
}

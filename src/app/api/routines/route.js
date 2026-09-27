import { NextResponse } from 'next/server';
import { getRoutinesForUser, createFullRoutine } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    const routines = await getRoutinesForUser(userId);
    return NextResponse.json({ routines });
  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ error: 'Erro ao buscar treinos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name || !data.user_id) {
      return NextResponse.json({ error: 'Nome do treino e aluno atribuído são obrigatórios' }, { status: 400 });
    }

    const routine = await createFullRoutine(data);
    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json({ error: 'Erro ao criar treino' }, { status: 500 });
  }
}

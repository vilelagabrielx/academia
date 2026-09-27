import { NextResponse } from 'next/server';
import { getExercises, createExercise } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || null;

    const exercises = await getExercises(search, category);
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Erro ao buscar exercícios' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Nome do exercício é obrigatório' }, { status: 400 });
    }

    const exercise = await createExercise(data);
    return NextResponse.json({ success: true, exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar exercício' }, { status: 500 });
  }
}

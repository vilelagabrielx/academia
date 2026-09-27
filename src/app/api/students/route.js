import { NextResponse } from 'next/server';
import { getStudents, createStudent } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const students = await getStudents(search);
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Erro ao buscar alunos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.username) {
      return NextResponse.json({ error: 'Nome de usuário é obrigatório' }, { status: 400 });
    }

    const student = await createStudent(data);
    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar aluno' }, { status: 500 });
  }
}

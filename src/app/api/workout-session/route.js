import { NextResponse } from 'next/server';
import { logWorkoutSession } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const result = await logWorkoutSession({
      user_id: user.id,
      routine_id: data.routine_id,
      day_id: data.day_id,
      notes: data.notes,
      logs: data.logs,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error logging workout session:', error);
    return NextResponse.json({ error: 'Erro ao registrar treino realizado' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { quickCreateStudent } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.first_name || !data.first_name.trim()) {
      return NextResponse.json({ error: 'Nome do aluno é obrigatório' }, { status: 400 });
    }

    const result = await quickCreateStudent(data);

    // Get origin or host for building the public link
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const link = `${protocol}://${host}/ficha/${result.token}`;

    const studentName = `${result.student.first_name || ''} ${result.student.last_name || ''}`.trim();
    const cleanPhone = (result.student.whatsapp || data.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${studentName || 'aluno(a)'}! Seja bem-vindo(a). Para personalizarmos seu treino, por favor preencha sua ficha no link: ${link}`
    );
    const whatsappLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;

    return NextResponse.json({
      success: true,
      student: result.student,
      token: result.token,
      link,
      whatsapp_link: whatsappLink,
    });
  } catch (error) {
    console.error('Error in quick-create student:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar cadastro rápido' }, { status: 500 });
  }
}

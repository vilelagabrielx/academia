import { NextResponse } from 'next/server';
import { getOrCreateOnboardingToken } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 });
    }

    const token = await getOrCreateOnboardingToken(parseInt(id, 10));

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const link = `${protocol}://${host}/ficha/${token}`;

    const body = await request.json().catch(() => ({}));
    const studentName = body.name || 'aluno(a)';
    const cleanPhone = (body.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${studentName}! Para personalizarmos seu plano de treino, por favor preencha sua ficha no link: ${link}`
    );
    const whatsappLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;

    return NextResponse.json({
      success: true,
      token,
      link,
      whatsapp_link: whatsappLink,
    });
  } catch (error) {
    console.error('Error generating onboarding link:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar link' }, { status: 500 });
  }
}

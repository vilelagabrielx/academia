import { NextResponse } from 'next/server';
import { getStudentByOnboardingToken, updateStudentByOnboardingToken } from '@/lib/db';

// Lightweight IP Rate Limiter for Public Access
const rateLimitMap = new Map();

function checkRateLimit(ip, limit = 30, windowMs = 60000) {
  const now = Date.now();
  // Prune expired records to prevent unbounded memory growth
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(ip, record);
  return record.count <= limit;
}

// Token format validator (UUID hex 32 or 36 chars)
function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const clean = token.replace(/-/g, '');
  return /^[a-f0-9]{32}$/i.test(clean);
}

// Security Response Headers
const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

export async function GET(request, { params }) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Por favor, aguarde um momento.' },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }

    const { token } = params;
    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: 'Token com formato inválido' }, { status: 400, headers: SECURITY_HEADERS });
    }

    const student = await getStudentByOnboardingToken(token);
    if (!student) {
      return NextResponse.json({ error: 'Ficha não encontrada ou link inválido' }, { status: 404, headers: SECURITY_HEADERS });
    }

    // Return ONLY safe, allowed student fields (NO user IDs, password hashes, or staff flags exposed)
    return NextResponse.json(
      {
        student: {
          first_name: String(student.first_name || '').slice(0, 100),
          last_name: String(student.last_name || '').slice(0, 100),
          email: String(student.email || '').slice(0, 150),
          whatsapp: String(student.whatsapp || '').slice(0, 30),
          instagram: String(student.instagram || '').slice(0, 100),
          photo_base64: student.photo_base64 && student.photo_base64.length < 8 * 1024 * 1024 ? student.photo_base64 : '',
          age: student.age ? Math.min(Math.max(parseInt(student.age, 10), 1), 120) : null,
          height: student.height ? Math.min(Math.max(parseInt(student.height, 10), 50), 250) : null,
          current_weight: student.current_weight ? Math.min(Math.max(parseFloat(student.current_weight), 20), 350) : null,
          blood_type: String(student.blood_type || '').slice(0, 10),
          goal: String(student.goal || '').slice(0, 100),
          training_days: String(student.training_days || '').slice(0, 100),
          fase_shape: String(student.fase_shape || '').slice(0, 50),
          nivel_treino: String(student.nivel_treino || '').slice(0, 50),
          frequencia_semanal: String(student.frequencia_semanal || '').slice(0, 50),
          divisao_treino: String(student.divisao_treino || '').slice(0, 50),
          objetivo_principal: String(student.objetivo_principal || '').slice(0, 100),
          objetivos_secundarios: String(student.objetivos_secundarios || '').slice(0, 500),
          pontos_fracos: Array.isArray(student.pontos_fracos) ? student.pontos_fracos.slice(0, 20) : [],
          lesoes_restricoes: String(student.lesoes_restricoes || '').slice(0, 1000),
          restricoes_articulares: Array.isArray(student.restricoes_articulares) ? student.restricoes_articulares.slice(0, 20) : [],
          condicoes_cardio_metabolicas: Array.isArray(student.condicoes_cardio_metabolicas) ? student.condicoes_cardio_metabolicas.slice(0, 20) : [],
          cirurgias_reabilitacao: String(student.cirurgias_reabilitacao || '').slice(0, 1000),
          status_atestado: String(student.status_atestado || '').slice(0, 50),
          medicamentos_uso_continuo: String(student.medicamentos_uso_continuo || '').slice(0, 1000),
          dor_cronica_nivel: Math.min(Math.max(parseInt(student.dor_cronica_nivel || 0, 10), 0), 10),
          dor_cronica_regiao: String(student.dor_cronica_regiao || '').slice(0, 100),
          horas_sono_media: student.horas_sono_media ? String(student.horas_sono_media).slice(0, 10) : '',
          qualidade_sono_estresse: String(student.qualidade_sono_estresse || '').slice(0, 50),
          recursos_ergogenicos: String(student.recursos_ergogenicos || '').slice(0, 500),
          contato_emergencia_nome: String(student.contato_emergencia_nome || '').slice(0, 100),
          contato_emergencia_parentesco: String(student.contato_emergencia_parentesco || '').slice(0, 50),
          contato_emergencia_telefone: String(student.contato_emergencia_telefone || '').slice(0, 30),
          birth_date: String(student.birth_date || student.data_nascimento || '').slice(0, 10),
          data_nascimento: String(student.data_nascimento || student.birth_date || '').slice(0, 10),
          onboarding_completed: Boolean(student.onboarding_completed),
          is_expired: Boolean(student.is_expired),
        },
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error('Error in GET /api/public/ficha/[token]:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar ficha' }, { status: 500, headers: SECURITY_HEADERS });
  }
}

export async function POST(request, { params }) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Limite de envios excedido. Por favor, aguarde 1 minuto.' },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }

    const { token } = params;
    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: 'Token com formato inválido' }, { status: 400, headers: SECURITY_HEADERS });
    }

    const rawData = await request.json().catch(() => null);
    if (!rawData || typeof rawData !== 'object') {
      return NextResponse.json({ error: 'Payload de dados inválido' }, { status: 400, headers: SECURITY_HEADERS });
    }

    // STRICT WHITE-LISTING & SANITIZATION OF PUBLIC SUBMISSION DATA
    const sanitizedData = {
      first_name: String(rawData.first_name || '').trim().slice(0, 100),
      last_name: String(rawData.last_name || '').trim().slice(0, 100),
      email: String(rawData.email || '').trim().slice(0, 150),
      whatsapp: String(rawData.whatsapp || '').trim().slice(0, 30),
      instagram: String(rawData.instagram || '').trim().slice(0, 100),
      photo_base64: typeof rawData.photo_base64 === 'string' && rawData.photo_base64.length < 8 * 1024 * 1024 ? rawData.photo_base64 : '',
      birth_date: String(rawData.birth_date || rawData.data_nascimento || '').trim().slice(0, 10),
      data_nascimento: String(rawData.data_nascimento || rawData.birth_date || '').trim().slice(0, 10),
      age: rawData.age ? Math.min(Math.max(parseInt(rawData.age, 10), 1), 120) : null,
      height: rawData.height ? Math.min(Math.max(parseInt(rawData.height, 10), 50), 250) : null,
      current_weight: rawData.current_weight ? Math.min(Math.max(parseFloat(rawData.current_weight), 20), 350) : null,
      blood_type: String(rawData.blood_type || '').trim().slice(0, 10),
      goal: String(rawData.goal || rawData.objetivo_principal || '').trim().slice(0, 100),
      training_days: String(rawData.training_days || rawData.frequencia_semanal || '').trim().slice(0, 100),
      fase_shape: String(rawData.fase_shape || '').trim().slice(0, 50),
      nivel_treino: String(rawData.nivel_treino || '').trim().slice(0, 50),
      frequencia_semanal: String(rawData.frequencia_semanal || '').trim().slice(0, 50),
      divisao_treino: String(rawData.divisao_treino || '').trim().slice(0, 50),
      objetivo_principal: String(rawData.objetivo_principal || '').trim().slice(0, 100),
      objetivos_secundarios: String(rawData.objetivos_secundarios || '').trim().slice(0, 500),
      pontos_fracos: Array.isArray(rawData.pontos_fracos)
        ? rawData.pontos_fracos.filter((i) => typeof i === 'string').map((s) => s.slice(0, 100)).slice(0, 20)
        : [],
      lesoes_restricoes: String(rawData.lesoes_restricoes || '').trim().slice(0, 1000),
      restricoes_articulares: Array.isArray(rawData.restricoes_articulares)
        ? rawData.restricoes_articulares.filter((i) => typeof i === 'string').map((s) => s.slice(0, 100)).slice(0, 20)
        : [],
      condicoes_cardio_metabolicas: Array.isArray(rawData.condicoes_cardio_metabolicas)
        ? rawData.condicoes_cardio_metabolicas.filter((i) => typeof i === 'string').map((s) => s.slice(0, 100)).slice(0, 20)
        : [],
      cirurgias_reabilitacao: String(rawData.cirurgias_reabilitacao || '').trim().slice(0, 1000),
      status_atestado: String(rawData.status_atestado || '').trim().slice(0, 50),
      medicamentos_uso_continuo: String(rawData.medicamentos_uso_continuo || '').trim().slice(0, 1000),
      dor_cronica_nivel: Math.min(Math.max(parseInt(rawData.dor_cronica_nivel || 0, 10), 0), 10),
      dor_cronica_regiao: String(rawData.dor_cronica_regiao || '').trim().slice(0, 100),
      horas_sono_media: rawData.horas_sono_media ? String(rawData.horas_sono_media).slice(0, 10) : '',
      qualidade_sono_estresse: String(rawData.qualidade_sono_estresse || '').trim().slice(0, 50),
      recursos_ergogenicos: String(rawData.recursos_ergogenicos || '').trim().slice(0, 500),
      contato_emergencia_nome: String(rawData.contato_emergencia_nome || '').trim().slice(0, 100),
      contato_emergencia_parentesco: String(rawData.contato_emergencia_parentesco || '').trim().slice(0, 50),
      contato_emergencia_telefone: String(rawData.contato_emergencia_telefone || '').trim().slice(0, 30),
      initial_evaluation: rawData.initial_evaluation && typeof rawData.initial_evaluation === 'object'
        ? {
            peso: rawData.initial_evaluation.peso ? String(rawData.initial_evaluation.peso).slice(0, 10) : '',
            bf_percentual: rawData.initial_evaluation.bf_percentual ? String(rawData.initial_evaluation.bf_percentual).slice(0, 10) : '',
            pescoco: rawData.initial_evaluation.pescoco ? String(rawData.initial_evaluation.pescoco).slice(0, 10) : '',
            ombro: rawData.initial_evaluation.ombro ? String(rawData.initial_evaluation.ombro).slice(0, 10) : '',
            peitoral_torax: rawData.initial_evaluation.peitoral_torax ? String(rawData.initial_evaluation.peitoral_torax).slice(0, 10) : '',
            cintura: rawData.initial_evaluation.cintura ? String(rawData.initial_evaluation.cintura).slice(0, 10) : '',
            abdomen: rawData.initial_evaluation.abdomen ? String(rawData.initial_evaluation.abdomen).slice(0, 10) : '',
            quadril: rawData.initial_evaluation.quadril ? String(rawData.initial_evaluation.quadril).slice(0, 10) : '',
            braco_direito: rawData.initial_evaluation.braco_direito ? String(rawData.initial_evaluation.braco_direito).slice(0, 10) : '',
            braco_esquerdo: rawData.initial_evaluation.braco_esquerdo ? String(rawData.initial_evaluation.braco_esquerdo).slice(0, 10) : '',
            braco_contraido: rawData.initial_evaluation.braco_contraido ? String(rawData.initial_evaluation.braco_contraido).slice(0, 10) : '',
            coxa_direita: rawData.initial_evaluation.coxa_direita ? String(rawData.initial_evaluation.coxa_direita).slice(0, 10) : '',
            coxa_esquerda: rawData.initial_evaluation.coxa_esquerda ? String(rawData.initial_evaluation.coxa_esquerda).slice(0, 10) : '',
            panturrilha_direita: rawData.initial_evaluation.panturrilha_direita ? String(rawData.initial_evaluation.panturrilha_direita).slice(0, 10) : '',
            panturrilha_esquerda: rawData.initial_evaluation.panturrilha_esquerda ? String(rawData.initial_evaluation.panturrilha_esquerda).slice(0, 10) : '',
            observacoes: rawData.initial_evaluation.observacoes ? String(rawData.initial_evaluation.observacoes).slice(0, 500) : '',
          }
        : null,
    };

    if (!sanitizedData.first_name) {
      return NextResponse.json({ error: 'Nome do aluno é obrigatório' }, { status: 400, headers: SECURITY_HEADERS });
    }

    await updateStudentByOnboardingToken(token, sanitizedData);

    return NextResponse.json(
      {
        success: true,
        message: 'Ficha enviada com sucesso!',
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error('Error in POST /api/public/ficha/[token]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar dados da ficha' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }
}

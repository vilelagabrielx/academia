import { NextResponse } from 'next/server';
import { uploadBillingProof } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { proof_base64, proof_filename } = await request.json();

    if (!proof_base64) {
      return NextResponse.json({ error: 'Comprovante não enviado' }, { status: 400 });
    }

    const updated = await uploadBillingProof(id, { proof_base64, proof_filename });
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error uploading billing proof:', error);
    return NextResponse.json({ error: 'Erro ao enviar comprovante' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getQuickNotes, createQuickNote } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || null;
    const studentId = searchParams.get('student_id') || null;
    const billingId = searchParams.get('billing_id') || null;
    const expenseId = searchParams.get('expense_id') || null;
    const search = searchParams.get('search') || '';

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    let limit = null;
    let offset = 0;
    
    if (pageParam || limitParam) {
      const page = parseInt(pageParam || '1', 10);
      limit = parseInt(limitParam || '20', 10);
      offset = (Math.max(1, page) - 1) * limit;
    }

    const cacheKey = `notes:${category || 'all'}:${studentId || 'all'}:${billingId || 'all'}:${expenseId || 'all'}:${search}:${pageParam || '1'}:${limitParam || '20'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=59' }
      });
    }

    const notes = await getQuickNotes({
      category,
      student_id: studentId,
      billing_id: billingId,
      expense_id: expenseId,
      search,
      limit,
      offset
    });

    const hasMore = limit ? notes.length === limit : false;
    const responseData = { success: true, notes, hasMore };

    cache.set(cacheKey, responseData, 30); // 30s TTL

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=59' }
    });
  } catch (error) {
    console.error('Error fetching quick notes:', error);
    return NextResponse.json({ error: 'Erro ao carregar anotações' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'O conteúdo da anotação é obrigatório' }, { status: 400 });
    }

    const note = await createQuickNote(body);
    cache.delPrefix('notes:');
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error creating quick note:', error);
    return NextResponse.json({ error: 'Erro ao criar anotação' }, { status: 500 });
  }
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Dumbbell, FileText, Plus, MessageCircle, Instagram, ArrowUpRight, Search, Activity, 
  UserPlus, CheckCircle2, Eye, User, Scale, Droplet, Target, Calendar, CreditCard, Trash2, RefreshCw, AlertTriangle, AlertCircle, TrendingDown, DollarSign, Sparkles 
} from 'lucide-react';

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [financeStats, setFinanceStats] = useState({
    total_receber: 0,
    total_despesas: 0,
    lucro_liquido: 0,
    receitas: 0,
  });
  const [loading, setLoading] = useState(true);

  // Toast & Confirm Modal States
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [quickSearch, setQuickSearch] = useState('');

  // Student Profile Detail View Modal State
  const [viewingStudent, setViewingStudent] = useState(null);

  // Quick Add Student Modal State (com opção de 1ª cobrança)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    whatsapp: '',
    instagram: '',
    password: '',
    create_first_billing: false,
    billing_amount: '150.00',
    billing_due_date: new Date().toISOString().split('T')[0],
    billing_notes: 'Mensalidade',
    billing_payment_method: 'Pix',
    is_recurring: false,
  });
  const [creating, setCreating] = useState(false);

  // Renew / Create Billing Modal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewBillingData, setRenewBillingData] = useState({
    user_id: '',
    student_name: '',
    amount: '150.00',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Pix',
    notes: 'Mensalidade',
    is_recurring: false,
  });
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdRes, exRes, rtRes, cfRes, bSummaryRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/exercises'),
        fetch('/api/routines'),
        fetch('/api/cashflow'),
        fetch('/api/billings'),
      ]);
      const stdData = await stdRes.json();
      const exData = await exRes.json();
      const rtData = await rtRes.json();
      const cfData = await cfRes.json();
      const bSummaryData = await bSummaryRes.json();

      setStudents(stdData.students || []);
      setExercises(exData.exercises || []);
      setRoutines(rtData.routines || []);

      const cf = cfData.cashflow || {};
      const sum = bSummaryData.summary || {};

      setFinanceStats({
        total_receber: sum.total_receber || (parseFloat(sum.total_pending || 0) + parseFloat(sum.total_charged || 0) + parseFloat(sum.total_overdue || 0)),
        total_despesas: cf.despesas || 0,
        lucro_liquido: cf.lucro_liquido || 0,
        receitas: cf.receitas || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const cleanPhone = newStudent.whatsapp.replace(/\D/g, '');
      const formattedPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '';

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          whatsapp: formattedPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar aluno');

      setNewStudent({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        whatsapp: '',
        instagram: '',
        password: '',
        create_first_billing: false,
        billing_amount: '150.00',
        billing_due_date: new Date().toISOString().split('T')[0],
        billing_notes: 'Mensalidade',
        billing_payment_method: 'Pix',
        is_recurring: false,
      });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRenewModal = (student) => {
    const today = new Date().toISOString().split('T')[0];
    let suggestedDate = today;

    if (student.latest_billing_due_date) {
      const baseStr = String(student.latest_billing_due_date).split('T')[0];
      const parts = baseStr.split('-');
      const baseYear = parseInt(parts[0], 10);
      const baseMonth = parseInt(parts[1], 10) - 1;
      const baseDay = parseInt(parts[2], 10);
      
      const targetDate = new Date(baseYear, baseMonth + 1, 1);
      const maxDays = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const safeDay = Math.min(baseDay, maxDays);
      suggestedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    }

    setRenewBillingData({
      user_id: student.id,
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username,
      amount: student.last_paid_amount || student.latest_billing_amount || '150.00',
      due_date: suggestedDate,
      payment_method: 'Pix',
      notes: 'Mensalidade',
      is_recurring: false,
    });
    setShowRenewModal(true);
  };

  const handleSubmitRenewBilling = async (e) => {
    e.preventDefault();
    setRenewing(true);

    try {
      const res = await fetch('/api/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renewBillingData),
      });
      const data = await res.json();

      if (res.status === 409 || data.duplicate) {
        showToast(data.error || 'Já existe uma cobrança vinculada a este aluno para este período!', 'warning');
        setShowRenewModal(false);
        loadData();
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      showToast('Cobrança criada com sucesso!', 'success');
      setShowRenewModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRenewing(false);
    }
  };

  const openWhatsAppForBilling = (student) => {
    const rawPhone = student.whatsapp?.replace(/\D/g, '');
    if (!rawPhone) return showToast('Aluno não possui número de WhatsApp cadastrado!', 'warning');

    const name = student.first_name || student.username;
    const amountVal = student.current_billing?.amount || student.latest_billing_amount || '150.00';
    const amountStr = parseFloat(amountVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const dueDateVal = student.current_billing?.due_date || student.latest_billing_due_date || new Date().toISOString();
    const dueDateStr = new Date(dueDateVal).toLocaleDateString('pt-BR');
    const statusText = student.billing_status === 'atrasada' ? 'está em atraso' : 'está pendente';

    const defaultMsg = `Olá, ${name}! Sua mensalidade de R$ ${amountStr}, com vencimento em ${dueDateStr}, ${statusText}. Caso já tenha realizado o pagamento, por favor envie o comprovante.`;

    const formattedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const encodedText = encodeURIComponent(defaultMsg);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  const handleDelete = (id, name) => {
    setConfirmModal({
      title: 'Excluir Aluno',
      message: `Tem certeza que deseja excluir o aluno ${name}? Esta ação não poderá ser desfeita.`,
      confirmText: 'Excluir Aluno',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Erro ao excluir aluno');
          showToast('Aluno excluído com sucesso!', 'success');
          setViewingStudent(null);
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleCancelEnrollment = (studentId, studentName) => {
    setConfirmModal({
      title: 'Cancelar Matrícula',
      message: `Tem certeza que deseja CANCELAR A MATRÍCULA de ${studentName}? Todas as mensalidades futuras pendentes serão canceladas.`,
      confirmText: 'Cancelar Matrícula',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/students/${studentId}/cancel-enrollment`, { method: 'POST' });
          if (!res.ok) throw new Error('Erro ao cancelar matrícula');
          showToast('Matrícula cancelada com sucesso!', 'success');
          setViewingStudent(null);
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const filteredStudents = students.filter((s) => {
    const full = `${s.first_name} ${s.last_name} ${s.username} ${s.whatsapp}`.toLowerCase();
    return full.includes(quickSearch.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Painel de Gestão da Academia
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              Gerencie seus alunos, controle mensalidades, saídas de caixa e acompanhe o <strong className="text-white font-semibold">Lucro Parcial Mensal</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>Novo Aluno</span>
            </button>
            <Link
              href="/dashboard/routines/new"
              className="bg-[#1C1C1E] hover:bg-white/10 text-slate-200 font-semibold px-5 py-3 rounded-xl border border-white/10 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Treino</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 💰 Destaques Financeiros (Total a Receber [Neutro], Total de Despesas [Rosa], Lucro Parcial Mensal [Verde]) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total a Receber (Cor Neutra) */}
        <Link href="/dashboard/billings" className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#161618] hover:border-white/20 transition-all flex items-center gap-4 group">
          <div className="p-3.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Total a Receber</span>
            <span className="text-2xl font-bold text-white">
              R$ {parseFloat(financeStats.total_receber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Link>

        {/* Card 2: Total de Despesas (Rosa/Red) */}
        <Link href="/dashboard/expenses" className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#161618] hover:border-white/20 transition-all flex items-center gap-4 group">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Total de Despesas</span>
            <span className="text-2xl font-bold text-rose-400">
              R$ {parseFloat(financeStats.total_despesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Link>

        {/* Card 3: Lucro Parcial Mensal (Verde) */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#161618] flex items-center gap-4">
          <div className={`p-3.5 rounded-xl border ${
            financeStats.lucro_liquido >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold block text-slate-400">Lucro Parcial Mensal</span>
            <span className={`text-2xl font-bold ${financeStats.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {parseFloat(financeStats.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#161618] flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Total de Alunos</span>
            <span className="text-3xl font-extrabold text-white">{students.length}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#161618] flex items-center gap-4">
          <div className="p-4 rounded-xl bg-white/5 text-slate-300 border border-white/10">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Treinos Criados</span>
            <span className="text-3xl font-extrabold text-white">{routines.length}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#161618] flex items-center gap-4">
          <div className="p-4 rounded-xl bg-white/5 text-slate-300 border border-white/10">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Exercícios no Banco</span>
            <span className="text-3xl font-extrabold text-white">{exercises.length}</span>
          </div>
        </div>
      </div>

      {/* Guia de Início Rápido / Ações de Arranque (Onboarding for Empty or New Account state) */}
      {students.length === 0 && (
        <div className="p-6 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Guia de Início Rápido</h2>
              <p className="text-xs text-slate-400">Comece organizando sua academia em poucos passos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="p-4 rounded-xl bg-[#1C1C1E] hover:bg-white/10 border border-white/10 text-left transition-all group cursor-pointer active:scale-95 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">1</div>
              <span className="block font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">Cadastrar 1º Aluno</span>
              <span className="block text-[11px] text-slate-400">Adicione o perfil, contato e vencimento</span>
            </button>

            <Link
              href="/dashboard/routines/new"
              className="p-4 rounded-xl bg-[#1C1C1E] hover:bg-white/10 border border-white/10 text-left transition-all group cursor-pointer active:scale-95 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">2</div>
              <span className="block font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">Montar Ficha de Treino</span>
              <span className="block text-[11px] text-slate-400">Monte séries e rotinas personalizadas</span>
            </Link>

            <Link
              href="/dashboard/billings"
              className="p-4 rounded-xl bg-[#1C1C1E] hover:bg-white/10 border border-white/10 text-left transition-all group cursor-pointer active:scale-95 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
              <span className="block font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">Gerenciar Financeiro</span>
              <span className="block text-[11px] text-slate-400">Lance entradas e despesas recorrentes</span>
            </Link>
          </div>
        </div>
      )}

      {/* Students Quick Table Section */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Alunos Cadastrados
            </h2>
            <p className="text-xs text-slate-400 mt-1">Alunos sem cobrança válida aparecem no topo da lista</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Buscar por nome ou WhatsApp..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando dados dos alunos...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-[#8E8E93] text-sm">Nenhum aluno encontrado.</div>
        ) : (
          <>
            {/* Mobile Touch Cards View (HIG Style) */}
            <div className="block md:hidden space-y-3">
              {filteredStudents.map((student) => {
                const phone = student.whatsapp?.replace(/\D/g, '');
                const waUrl = phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : null;
                const status = student.billing_status;

                return (
                  <div
                    key={student.id}
                    onClick={() => setViewingStudent(student)}
                    className="p-4 rounded-2xl bg-[#1C1C1E]/80 border border-white/10 shadow-lg active:scale-[0.99] transition-all space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {student.photo_base64 ? (
                          <img
                            src={student.photo_base64}
                            alt={student.username}
                            className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-md"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center font-bold text-[#D4AF37] text-base">
                            {student.first_name?.[0] || student.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="block font-bold text-sm text-white">
                            {student.first_name} {student.last_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">@{student.username}</span>
                        </div>
                      </div>

                      {/* Billing Status Badge */}
                      <div>
                        {status === 'sem_cobranca' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            🔴 Sem cobrança
                          </span>
                        )}
                        {status === 'atrasada' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            🔴 Atrasada
                          </span>
                        )}
                        {status === 'pendente' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            🟡 Pendente
                          </span>
                        )}
                        {status === 'em_dia' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🟢 Em dia
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold active:scale-95 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sem WhatsApp</span>
                      )}

                      {(status === 'sem_cobranca' || status === 'em_dia') && (
                        <button
                          onClick={() => handleOpenRenewModal(student)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#D4AF37] text-black font-extrabold text-xs active:scale-95 transition-all shadow-md"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Renovar</span>
                        </button>
                      )}

                      <button
                        onClick={() => setViewingStudent(student)}
                        className="py-2 px-3 rounded-xl bg-white/10 text-white border border-white/10 text-xs font-semibold active:scale-95 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#1C1C1E] uppercase tracking-wider text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Aluno</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4 text-center">Situação da Cobrança</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((student) => {
                    const phone = student.whatsapp?.replace(/\D/g, '');
                    const waUrl = phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : null;
                    const status = student.billing_status;

                    return (
                      <tr
                        key={student.id}
                        className={`transition-all cursor-pointer group ${
                          status === 'sem_cobranca'
                            ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-4 border-l-rose-500'
                            : status === 'atrasada'
                            ? 'bg-rose-950/10 hover:bg-rose-950/20 border-l-4 border-l-rose-400'
                            : status === 'pendente'
                            ? 'bg-amber-950/10 hover:bg-amber-950/20 border-l-4 border-l-amber-400'
                            : 'hover:bg-white/5'
                        }`}
                        onClick={() => setViewingStudent(student)}
                      >
                        <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-3">
                          {student.photo_base64 ? (
                            <img
                              src={student.photo_base64}
                              alt={student.username}
                              className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]/40 group-hover:border-[#D4AF37]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center font-bold text-[#D4AF37]">
                              {student.first_name?.[0] || student.username[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="block font-bold text-sm text-white group-hover:text-[#D4AF37] transition-colors">
                              {student.first_name} {student.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">@{student.username}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-[11px] font-medium"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{student.whatsapp}</span>
                            </a>
                          ) : (
                            <span className="text-slate-600 italic">Não informado</span>
                          )}
                        </td>

                        {/* Student Billing Status Badges */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {status === 'sem_cobranca' && (
                            <div className="group relative inline-block">
                              <span className="px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 cursor-help shadow-sm">
                                🔴 Sem cobrança vinculada
                              </span>
                            </div>
                          )}

                          {status === 'atrasada' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                              🔴 Atrasada (R$ {parseFloat(student.current_billing?.amount || student.latest_billing_amount).toFixed(2)})
                            </span>
                          )}

                          {status === 'pendente' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                              🟡 Pendente (R$ {parseFloat(student.current_billing?.amount || student.latest_billing_amount).toFixed(2)})
                            </span>
                          )}

                          {status === 'em_dia' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                              🟢 Em dia
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          {(status === 'sem_cobranca' || status === 'em_dia') && (
                            <button
                              onClick={() => handleOpenRenewModal(student)}
                              title="Renovar ou Criar Cobrança"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#C5A059] transition-all cursor-pointer shadow-md"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Renovar cobrança</span>
                            </button>
                          )}

                          {(status === 'pendente' || status === 'atrasada') && (
                            <button
                              onClick={() => openWhatsAppForBilling(student)}
                              title="Enviar Lembrete por WhatsApp"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer shadow-md"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          <button
                            onClick={() => setViewingStudent(student)}
                            title="Ver Ficha Completa"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Ficha</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL STUDENT PROFILE DETAILS */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Ficha do Aluno
              </h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-6 rounded-2xl border border-slate-800">
              {viewingStudent.photo_base64 ? (
                <img
                  src={viewingStudent.photo_base64}
                  alt={viewingStudent.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-3xl shrink-0">
                  {viewingStudent.first_name?.[0] || viewingStudent.username[0]?.toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left space-y-2 flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-white">
                      {viewingStudent.first_name} {viewingStudent.last_name}
                    </h2>
                    {viewingStudent.billing_status === 'sem_cobranca' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-[10px] uppercase tracking-wider">
                        🔴 Sem cobrança vinculada
                      </span>
                    )}
                    {viewingStudent.billing_status === 'atrasada' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider">
                        🔴 Cobrança Atrasada
                      </span>
                    )}
                    {viewingStudent.billing_status === 'em_dia' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider">
                        🟢 Cobrança Em Dia
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono block mt-1">@{viewingStudent.username}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {viewingStudent.whatsapp && (
                    <a
                      href={`https://wa.me/${viewingStudent.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{viewingStudent.whatsapp}</span>
                    </a>
                  )}

                  {viewingStudent.instagram && (
                    <a
                      href={viewingStudent.instagram.startsWith('http') ? viewingStudent.instagram : `https://instagram.com/${viewingStudent.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950 via-pink-950 to-amber-950 border border-pink-500/50 text-pink-200 hover:text-white hover:border-pink-400 transition-all text-xs font-bold shadow-lg shadow-pink-500/20"
                    >
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <Instagram className="w-3.5 h-3.5" />
                      </div>
                      <span>{viewingStudent.instagram.startsWith('@') ? viewingStudent.instagram : `@${viewingStudent.instagram}`}</span>
                      <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/40 uppercase font-black">
                        Destaque 🌟
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Idade:
                </span>
                <span className="text-sm font-bold text-white block">
                  {viewingStudent.age ? `${viewingStudent.age} anos` : 'Não informada'}
                </span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" /> Peso Atual:
                </span>
                <span className="text-sm font-bold text-white block">
                  {viewingStudent.current_weight ? `${viewingStudent.current_weight} kg` : 'Não informado'}
                </span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-400" /> Tipo Sanguíneo:
                </span>
                <span className="text-sm font-bold text-white block">
                  {viewingStudent.blood_type || 'Não informado'}
                </span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" /> Objetivo:
                </span>
                <span className="text-sm font-bold text-white block">
                  {viewingStudent.goal || 'Geral'}
                </span>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Dias da Semana:
                </span>
                <span className="text-sm font-bold text-white block">
                  {viewingStudent.training_days || 'Não definido'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancelEnrollment(viewingStudent.id, viewingStudent.first_name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 cursor-pointer"
                >
                  Cancelar Matrícula
                </button>
                <button
                  onClick={() => handleDelete(viewingStudent.id, viewingStudent.first_name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
                >
                  Excluir
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const st = viewingStudent;
                    setViewingStudent(null);
                    handleOpenRenewModal(st);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-black bg-[#D4AF37] hover:bg-[#C5A059] shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  Renovar cobrança
                </button>
                <Link
                  href={`/dashboard/students?id=${viewingStudent.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
                >
                  Editar Cadastro
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Create Student (com opção de 1ª cobrança) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Cadastrar Novo Aluno
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="João"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sobrenome</label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Silva"
                  />
                </div>
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp (DDD + Número)</label>
                  <input
                    type="text"
                    value={newStudent.whatsapp}
                    onChange={(e) => setNewStudent({ ...newStudent, whatsapp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-pink-400 font-bold">
                      <Instagram className="w-3 h-3 text-pink-500 shrink-0" />
                      Instagram
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={newStudent.instagram || ''}
                    onChange={(e) => setNewStudent({ ...newStudent, instagram: e.target.value })}
                    className="w-full bg-slate-900 border border-pink-500/30 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    placeholder="@usuario ou link"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Senha de Acesso do Aluno</label>
                <input
                  type="password"
                  required
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              {/* Seção opcional de 1ª cobrança */}
              <label className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all">
                <input
                  type="checkbox"
                  checked={newStudent.create_first_billing}
                  onChange={(e) => setNewStudent({ ...newStudent, create_first_billing: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="font-bold text-white block text-xs">☐ Criar primeira cobrança para este aluno</span>
                  <span className="text-[10px] text-slate-400 block">
                    Gere a mensalidade inicial juntamente no cadastro (opcional).
                  </span>
                </div>
              </label>

              {newStudent.create_first_billing && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Valor da Mensalidade (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required={newStudent.create_first_billing}
                        value={newStudent.billing_amount}
                        onChange={(e) => setNewStudent({ ...newStudent, billing_amount: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">1º Vencimento *</label>
                      <input
                        type="date"
                        required={newStudent.create_first_billing}
                        value={newStudent.billing_due_date}
                        onChange={(e) => setNewStudent({ ...newStudent, billing_due_date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                      <select
                        value={newStudent.billing_payment_method}
                        onChange={(e) => setNewStudent({ ...newStudent, billing_payment_method: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Descrição</label>
                      <input
                        type="text"
                        value={newStudent.billing_notes}
                        onChange={(e) => setNewStudent({ ...newStudent, billing_notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                        placeholder="Mensalidade"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all">
                    <input
                      type="checkbox"
                      checked={newStudent.is_recurring}
                      onChange={(e) => setNewStudent({ ...newStudent, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-white block text-xs">Cobrança recorrente (12 Meses)</span>
                      <span className="text-[10px] text-slate-400 block">
                        Criar mensalidades automaticamente a cada mês por 12 meses.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  {creating ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RENOVAR COBRANÇA */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#D4AF37]" />
                Renovar Cobrança de Mensalidade
              </h3>
              <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitRenewBilling} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-white block">
                  Aluno: {renewBillingData.student_name}
                </span>
                <span className="text-[#D4AF37] text-[11px] block font-semibold">
                  Dados sugeridos com base no registro anterior
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={renewBillingData.amount}
                    onChange={(e) => setRenewBillingData({ ...renewBillingData, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-emerald-400 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={renewBillingData.due_date}
                    onChange={(e) => setRenewBillingData({ ...renewBillingData, due_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição / Observação</label>
                <input
                  type="text"
                  value={renewBillingData.notes}
                  onChange={(e) => setRenewBillingData({ ...renewBillingData, notes: e.target.value })}
                  placeholder="Mensalidade"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <select
                  value={renewBillingData.payment_method}
                  onChange={(e) => setRenewBillingData({ ...renewBillingData, payment_method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all">
                <input
                  type="checkbox"
                  checked={renewBillingData.is_recurring}
                  onChange={(e) => setRenewBillingData({ ...renewBillingData, is_recurring: e.target.checked })}
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="font-bold text-white block text-xs">Cobrança recorrente (12 Meses)</span>
                  <span className="text-[10px] text-slate-400 block">
                    Gerar mensalidades mensalmente por 12 meses no mesmo dia.
                  </span>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renewing}
                  className="px-5 py-2 rounded-xl font-bold text-black bg-[#D4AF37] hover:bg-[#C5A059] shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  {renewing ? 'Gerando...' : 'Confirmar Nova Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-bold max-w-md ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/60 hover:text-white ml-2">✕</button>
          </div>
        </div>
      )}

      {/* HIG Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.danger ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (action) action();
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                  confirmModal.danger ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                {confirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

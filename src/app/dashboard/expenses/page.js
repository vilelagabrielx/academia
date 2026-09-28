'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingDown, Plus, CheckCircle2, AlertCircle, AlertTriangle, Clock, DollarSign, Search, Filter, 
  Trash2, Upload, Calendar, Check, Repeat, FileText, ChevronLeft, ChevronRight, Eye, Sparkles, TrendingUp, ShieldAlert, Award
} from 'lucide-react';

const CATEGORIES = [
  'Estrutura & Custos Fixos',
  'Manutenção & Reparos',
  'Equipamentos & Acessórios',
  'Equipe & Serviços',
  'Marketing & Comercial',
  'Outros / Administrativo'
];

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Boleto', 'Dinheiro', 'Transferência (TED)'];

export default function ExpensesPage() {
  const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7);

  // Toast & Confirm Modal States
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cancel Expense Modal State
  const [showCancelExpenseModal, setShowCancelExpenseModal] = useState(false);
  const [selectedCancelExpense, setSelectedCancelExpense] = useState(null);
  const [cancelExpenseReason, setCancelExpenseReason] = useState('');
  const [cancellingExpense, setCancellingExpense] = useState(false);

  const [summary, setSummary] = useState({ 
    total_paid: 0, 
    total_pending: 0, 
    total_overdue: 0, 
    total_a_pagar: 0, 
    total_geral: 0, 
    top_category: 'Nenhuma',
    top_category_sum: 0
  });
  const [cashflow, setCashflow] = useState({
    receitas: 0,
    despesas: 0,
    lucro_liquido: 0,
    custo_fixo: 0,
    alunos_ponto_equilibrio: 0
  });

  const [expenses, setExpenses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(getCurrentMonthStr());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Fast Create Expense Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: 'Estrutura & Custos Fixos',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Pix',
    status: 'PENDING',
    notes: '',
    proof_base64: '',
    proof_filename: '',
    is_recurring: false,
    frequency: 'MONTHLY',
    due_day: '5',
    end_date: ''
  });

  // Mark as Paid Modal ("Dar Baixa")
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayExpense, setSelectedPayExpense] = useState(null);
  const [payProofBase64, setPayProofBase64] = useState('');
  const [payProofFilename, setPayProofFilename] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  // Proof Viewer Modal
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, monthFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, cfRes] = await Promise.all([
        fetch(`/api/expenses?status=${statusFilter}&category=${encodeURIComponent(categoryFilter)}&month_year=${monthFilter}&search=${encodeURIComponent(search)}`),
        fetch(`/api/cashflow?month_year=${monthFilter}`)
      ]);
      const expData = await expRes.json();
      const cfData = await cfRes.json();

      setSummary(expData.summary || {});
      setExpenses(expData.expenses || []);
      setCashflow(cfData.cashflow || {});
    } catch (err) {
      console.error('Error loading expenses data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthLabel = (mStr) => {
    if (!mStr || mStr === 'all') return '🌐 Todos os Meses (Visão Geral)';
    const [year, month] = mStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  };

  const changeMonthBy = (offset) => {
    if (monthFilter === 'all') {
      setMonthFilter(getCurrentMonthStr());
      return;
    }
    const [year, month] = monthFilter.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1 + offset, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setMonthFilter(`${y}-${m}`);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.due_date) {
      return showToast('Preencha os campos obrigatórios (Descrição, Valor e Data)!', 'warning');
    }
    setCreating(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar despesa');

      showToast('Despesa cadastrada com sucesso!', 'success');
      setShowCreateModal(false);
      setNewExpense({
        description: '',
        category: 'Estrutura & Custos Fixos',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        status: 'PENDING',
        notes: '',
        proof_base64: '',
        proof_filename: '',
        is_recurring: false,
        frequency: 'MONTHLY',
        due_day: '5',
        end_date: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayExpense) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/expenses/${selectedPayExpense.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: new Date().toISOString(),
          proof_base64: payProofBase64 || undefined,
          proof_filename: payProofFilename || undefined,
          notes: payNotes || selectedPayExpense.notes
        })
      });
      if (!res.ok) throw new Error('Erro ao registrar baixa da despesa');

      showToast('Baixa de despesa registrada com sucesso!', 'success');
      setShowPayModal(false);
      setSelectedPayExpense(null);
      setPayProofBase64('');
      setPayProofFilename('');
      setPayNotes('');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleCancelExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCancelExpense) return;
    if (!cancelExpenseReason.trim()) {
      return showToast('A justificativa de cancelamento é obrigatória!', 'warning');
    }
    setCancellingExpense(true);
    try {
      const res = await fetch(`/api/expenses/${selectedCancelExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancel_reason: cancelExpenseReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar despesa');

      showToast('Despesa cancelada com sucesso!', 'success');
      setShowCancelExpenseModal(false);
      setSelectedCancelExpense(null);
      setCancelExpenseReason('');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancellingExpense(false);
    }
  };

  const executeDeleteExpense = async (id, deleteRecurrence) => {
    try {
      const res = await fetch(`/api/expenses/${id}?delete_recurrence=${deleteRecurrence}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erro ao excluir despesa');
      showToast('Despesa excluída com sucesso!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteExpense = (exp) => {
    const isRec = Boolean(exp.recurrence_id);
    if (isRec) {
      setConfirmModal({
        title: 'Excluir Despesa Recorrente',
        message: `A despesa "${exp.description}" faz parte de uma recorrência. Escolha como deseja proceder:`,
        cancelText: 'Fechar',
        customOptions: [
          {
            label: 'Apagar SOMENTE esta',
            className: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
            onClick: () => executeDeleteExpense(exp.id, false)
          },
          {
            label: 'Cancelar ESTA e PRÓXIMAS',
            className: 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/30',
            onClick: () => executeDeleteExpense(exp.id, true)
          }
        ]
      });
    } else {
      setConfirmModal({
        title: 'Excluir Despesa',
        message: `Tem certeza que deseja excluir a despesa "${exp.description}"?`,
        confirmText: 'Excluir Despesa',
        danger: true,
        onConfirm: () => executeDeleteExpense(exp.id, false)
      });
    }
  };

  const handleFileUpload = (e, setBase64, setFilename) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('Arquivo muito grande! Máximo 5MB.', 'warning');

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64(reader.result);
      setFilename(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-400" />
            Módulo de Despesas & Saídas de Caixa
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle contas fixas, saídas operacionais e veja seu **Lucro Parcial Mensal** em tempo real.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all text-sm cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Despesa (15s)</span>
        </button>
      </div>

      {/* Month / Temporal Navigation Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Filtro Temporal de Despesas</span>
            <span className="text-sm font-extrabold text-white flex items-center gap-2">
              {formatMonthLabel(monthFilter)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => changeMonthBy(-1)}
              disabled={monthFilter === 'all'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer transition-all"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="month"
              value={monthFilter === 'all' ? '' : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value || 'all')}
              className="bg-transparent border-0 text-xs font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
            />

            <button
              onClick={() => changeMonthBy(1)}
              disabled={monthFilter === 'all'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer transition-all"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setMonthFilter(monthFilter === 'all' ? getCurrentMonthStr() : 'all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              monthFilter === 'all'
                ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {monthFilter === 'all' ? '🗓️ Mês Atual' : '🌐 Visão Geral'}
          </button>
        </div>
      </div>

      {/* Summary Cards Grid (Total a Receber, Total Despesas, LUCRO PARCIAL MENSAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Card 1: Total de Despesas Pagas */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 bg-rose-950/10">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Total Pago (Saídas)</span>
            <span className="text-lg font-extrabold text-rose-400">
              R$ {parseFloat(summary.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-rose-500/80 block font-medium">{summary.count_paid || 0} contas pagas</span>
          </div>
        </div>

        {/* Card 2: A Pagar no Mês */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 bg-amber-950/10">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">A Pagar no Mês</span>
            <span className="text-lg font-extrabold text-amber-400">
              R$ {parseFloat(summary.total_a_pagar || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-500/80 block font-medium">Pendente + Atrasado</span>
          </div>
        </div>

        {/* Card 3: LUCRO PARCIAL MENSAL (Destaque Verde/Emerald) */}
        <div className={`glass-panel p-4 rounded-2xl border flex items-center gap-3 shadow-lg relative overflow-hidden ${
          cashflow.lucro_liquido >= 0
            ? 'border-emerald-500/40 bg-emerald-950/20 shadow-emerald-950/30'
            : 'border-rose-500/40 bg-rose-950/20 shadow-rose-950/30'
        }`}>
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500/20 text-[9px] font-black text-emerald-300 uppercase tracking-tighter rounded-bl-lg">
            Parcial Mês
          </div>
          <div className={`p-3 rounded-xl border shrink-0 ${
            cashflow.lucro_liquido >= 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold block text-emerald-300">Lucro Parcial Mensal</span>
            <span className={`text-lg font-black ${cashflow.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {parseFloat(cashflow.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Entradas - Saídas Pagas</span>
          </div>
        </div>

        {/* Card 4: Principal Categoria & Ponto de Equilíbrio */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Principal Categoria</span>
            <span className="text-sm font-extrabold text-white truncate block max-w-[150px]">
              {summary.top_category || 'Nenhuma'}
            </span>
            <span className="text-[10px] text-cyan-400 block font-medium">
              Ponto Equilíbrio: ~{cashflow.alunos_ponto_equilibrio || 0} alunos
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar despesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-full sm:w-56 focus:border-rose-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-rose-500"
          >
            <option value="">Todos os Status</option>
            <option value="PENDING">🟡 Pendentes</option>
            <option value="PAID">🟢 Pagas</option>
            <option value="OVERDUE">🔴 Atrasadas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-rose-500"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total de {expenses.length} lançamentos
        </span>
      </div>

      {/* Table / Expenses List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Forma</th>
                <th className="py-3.5 px-4">Valor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">Carregando despesas...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Nenhuma despesa encontrada neste período.</td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const isPaid = exp.status === 'PAID';
                  const isOverdue = exp.status === 'OVERDUE';
                  const isRec = Boolean(exp.recurrence_id);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-all">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {exp.due_date ? String(exp.due_date).split('T')[0] : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <span>{exp.description}</span>
                        {isRec && (
                          <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] rounded font-mono" title="Despesa Recorrente">
                            🔄 Recorrente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-semibold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{exp.payment_method || 'Pix'}</td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-400 text-sm">
                        -R$ {parseFloat(exp.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </span>
                        ) : exp.status === 'CANCELLED' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10 font-bold text-[10px] flex items-center gap-1 w-fit" title={exp.cancel_reason}>
                            Cancelado
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Atrasado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                        {exp.status === 'CANCELLED' && exp.cancel_reason && (
                          <span className="text-[9px] text-slate-500 block italic mt-0.5" title={exp.cancel_reason}>
                            Motivo: {exp.cancel_reason.length > 20 ? `${exp.cancel_reason.slice(0, 20)}...` : exp.cancel_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && exp.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => { setSelectedPayExpense(exp); setShowPayModal(true); }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 text-[11px] transition-all cursor-pointer shadow-md"
                              >
                                Dar Baixa
                              </button>
                              <button
                                onClick={() => { setSelectedCancelExpense(exp); setCancelExpenseReason(''); setShowCancelExpenseModal(true); }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-[11px] transition-all cursor-pointer"
                                title="Cancelar despesa com justificativa"
                              >
                                Cancelar
                              </button>
                            </>
                          )}

                          {exp.proof_base64 && (
                            <button
                              onClick={() => { setSelectedProof(exp); setShowProofModal(true); }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                              title="Ver Comprovante"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir Despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRAR NOVA DESPESA (MODAL RÁPIDO 15s) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Cadastrar Nova Despesa (Saída)
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição * (Obrigatório)</label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Ex: Aluguel da Sala, Manutenção Esteira, Tráfego Pago..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-rose-500 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="450.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-rose-400 font-extrabold text-sm focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vencimento / Pagamento *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.due_date}
                    onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Categorias Prontas (Chips) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Categoria *</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewExpense({ ...newExpense, category: cat })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                        newExpense.category === cat
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md scale-105'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Inicial</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, status: 'PENDING' })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newExpense.status === 'PENDING' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      🟡 Pendente
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, status: 'PAID' })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newExpense.status === 'PAID' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      🟢 Pago
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Forma de Saída</label>
                  <select
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Recorrência Funcional */}
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExpense.is_recurring}
                    onChange={(e) => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-white block text-xs flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                      Despesa Recorrente? (Repetir mensalmente)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Cria uma regra de recorrência sem duplicação no banco de dados (geração sob demanda JIT).
                    </span>
                  </div>
                </label>

                {newExpense.is_recurring && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Dia do Vencimento</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={newExpense.due_day}
                        onChange={(e) => setNewExpense({ ...newExpense, due_day: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Frequência</label>
                      <select
                        value={newExpense.frequency}
                        onChange={(e) => setNewExpense({ ...newExpense, frequency: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                      >
                        <option value="MONTHLY">Mensal (Todo mês)</option>
                        <option value="YEARLY">Anual (Uma vez por ano)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload de Comprovante */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comprovante / Recibo (Opcional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold cursor-pointer flex items-center gap-2 text-xs">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>{newExpense.proof_filename || 'Escolher Arquivo...'}</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, (b) => setNewExpense({ ...newExpense, proof_base64: b }), (fn) => setNewExpense({ ...newExpense, proof_filename: fn }))} className="hidden" />
                  </label>
                  {newExpense.proof_filename && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Anexado</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-rose-500 hover:bg-rose-400 shadow-md"
                >
                  {creating ? 'Salvando...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DAR BAIXA RÁPIDA (REGISTRAR PAGAMENTO DA DESPESA) */}
      {showPayModal && selectedPayExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Confirmar Baixa de Despesa
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-400">Descrição:</span><span className="font-bold text-white">{selectedPayExpense.description}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Categoria:</span><span className="font-semibold text-slate-300">{selectedPayExpense.category}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Valor:</span><span className="font-extrabold text-rose-400">R$ {parseFloat(selectedPayExpense.amount).toFixed(2)}</span></div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Anexar Comprovante Pix / PDF (Opcional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, setPayProofBase64, setPayProofFilename)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" disabled={paying} className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400">
                  {paying ? 'Confirmando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VER COMPROVANTE */}
      {showProofModal && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Comprovante de Despesa</h3>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center">
              {selectedProof.proof_base64?.startsWith('data:image') ? (
                <img src={selectedProof.proof_base64} alt="Comprovante" className="max-w-full rounded-2xl border border-slate-800" />
              ) : (
                <a href={selectedProof.proof_base64} download={selectedProof.proof_filename || 'comprovante.pdf'} className="px-4 py-3 rounded-2xl bg-slate-800 text-cyan-400 font-bold underline">
                  Baixar Documento / PDF ({selectedProof.proof_filename || 'comprovante.pdf'})
                </a>
              )}
            </div>
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

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>
              {confirmModal.customOptions ? (
                confirmModal.customOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setConfirmModal(null);
                      opt.onClick();
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${opt.className}`}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const action = confirmModal.onConfirm;
                    setConfirmModal(null);
                    if (action) action();
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-md ${
                    confirmModal.danger ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirmar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR DESPESA (JUSTIFICATIVA OBRIGATÓRIA) */}
      {showCancelExpenseModal && selectedCancelExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Cancelar Despesa</span>
              </h3>
              <button onClick={() => setShowCancelExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-400">Descrição:</span><span className="font-bold text-white">{selectedCancelExpense.description}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Valor:</span><span className="font-extrabold text-rose-400">R$ {parseFloat(selectedCancelExpense.amount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Categoria:</span><span className="font-semibold text-slate-300">{selectedCancelExpense.category}</span></div>
            </div>

            <form onSubmit={handleCancelExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-amber-300 mb-1">
                  Justificativa de Cancelamento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelExpenseReason}
                  onChange={(e) => setCancelExpenseReason(e.target.value)}
                  placeholder="Digite o motivo do cancelamento da despesa (ex: Serviço não executado, Cobrança indevida, Substituição de nota)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCancelExpenseModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={cancellingExpense || !cancelExpenseReason.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                >
                  {cancellingExpense ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

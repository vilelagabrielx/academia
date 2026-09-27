'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, Plus, CheckCircle2, AlertCircle, Clock, MessageCircle, FileText, Download, Eye, 
  Trash2, Search, DollarSign, Send, Filter, Printer, BellRing, Upload, Calendar, Check, Repeat, 
  UserX, AlertTriangle, Pencil, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Layers, Award, Sparkles,
  Users, User, Dumbbell, Heart, ShieldAlert, ExternalLink, Instagram
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Estrutura & Custos Fixos',
  'Manutenção & Reparos',
  'Equipamentos & Acessórios',
  'Equipe & Serviços',
  'Marketing & Comercial',
  'Outros / Administrativo'
];

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Boleto', 'Dinheiro', 'Transferência (TED)'];

const getBillingStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'paid':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
          🟢 Pago
        </span>
      );
    case 'overdue':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
          🔴 Atrasado
        </span>
      );
    case 'charged':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
          🟣 Cobrado
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
          ⚪ Cancelado
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
          🟡 Pendente
        </span>
      );
  }
};

const getExpenseStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'PAID':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
          🟢 Pago
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
          🔴 Atrasado
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
          🟡 Pendente
        </span>
      );
  }
};

export default function FinancialPage() {
  const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7);

  // Active Sub-Tab: 'entradas' (Mensalidades) | 'saidas' (Despesas) | 'fluxo' (Fluxo de Caixa)
  const [activeTab, setActiveTab] = useState('entradas');

  const [monthFilter, setMonthFilter] = useState(getCurrentMonthStr());
  const [statusFilter, setStatusFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Financial Data States
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0, total_charged: 0, total_overdue: 0, total_receber: 0, total_geral: 0 });
  const [expenseSummary, setExpenseSummary] = useState({ total_paid: 0, total_pending: 0, total_overdue: 0, total_a_pagar: 0, top_category: 'Nenhuma' });
  const [cashflow, setCashflow] = useState({ receitas: 0, despesas: 0, lucro_liquido: 0, custo_fixo: 0, alunos_ponto_equilibrio: 0 });

  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);

  // Student Profile Detail Viewer Modal
  const [viewingStudent, setViewingStudent] = useState(null);

  const openStudentProfile = (b) => {
    const matched = students.find((s) => String(s.id) === String(b.user_id) || s.username === b.username) || {
      id: b.user_id,
      first_name: b.first_name,
      last_name: b.last_name,
      username: b.username,
      whatsapp: b.whatsapp,
      photo_base64: b.photo_base64,
    };
    setViewingStudent(matched);
  };

  // Modals: Billings (Entradas)
  const [showCreateBillingModal, setShowCreateBillingModal] = useState(false);
  const [newBilling, setNewBilling] = useState({
    user_id: '',
    amount: '150.00',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Pix',
    notes: '',
    is_recurring: false,
  });
  const [creatingBilling, setCreatingBilling] = useState(false);

  // Edit Billing Modal
  const [showEditBillingModal, setShowEditBillingModal] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [editBillingFormData, setEditBillingFormData] = useState({ amount: '', due_date: '', notes: '', payment_method: 'Pix', scope: 'single' });
  const [editStep, setEditStep] = useState('form');
  const [savingEditBilling, setSavingEditBilling] = useState(false);

  // Convert to Monthly Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedConvertBilling, setSelectedConvertBilling] = useState(null);
  const [createNextMonthOption, setCreateNextMonthOption] = useState(true);
  const [converting, setConverting] = useState(false);

  // WhatsApp Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [selectedWaBilling, setSelectedWaBilling] = useState(null);
  const [waMessage, setWaMessage] = useState('');

  // Charge / Remind Modal
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedChargeBilling, setSelectedChargeBilling] = useState(null);
  const [remindDays, setRemindDays] = useState('3');
  const [customRemindDate, setCustomRemindDate] = useState('');
  const [chargeNotes, setChargeNotes] = useState('');
  const [charging, setCharging] = useState(false);

  // Paid Student Billing Modal
  const [showPaidBillingModal, setShowPaidBillingModal] = useState(false);
  const [selectedPaidBilling, setSelectedPaidBilling] = useState(null);
  const [paidBillingProofBase64, setPaidBillingProofBase64] = useState('');
  const [paidBillingProofFilename, setPaidBillingProofFilename] = useState('');
  const [paidBillingNotes, setPaidBillingNotes] = useState('');
  const [savingPaidBilling, setSavingPaidBilling] = useState(false);

  // Modals: Expenses (Saídas)
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
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

  const [showPayExpenseModal, setShowPayExpenseModal] = useState(false);
  const [selectedPayExpense, setSelectedPayExpense] = useState(null);
  const [payExpenseProofBase64, setPayExpenseProofBase64] = useState('');
  const [payExpenseProofFilename, setPayExpenseProofFilename] = useState('');
  const [payingExpense, setPayingExpense] = useState(false);

  // Common Viewers
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [selectedProofData, setSelectedProofData] = useState(null);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, expenseCategoryFilter, monthFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes, expRes, cfRes] = await Promise.all([
        fetch(`/api/billings?status=${statusFilter}&month_year=${monthFilter}&search=${encodeURIComponent(search)}`),
        fetch('/api/students'),
        fetch(`/api/expenses?category=${encodeURIComponent(expenseCategoryFilter)}&month_year=${monthFilter}&search=${encodeURIComponent(search)}`),
        fetch(`/api/cashflow?month_year=${monthFilter}`)
      ]);

      const bData = await bRes.json();
      const sData = await sRes.json();
      const expData = await expRes.json();
      const cfData = await cfRes.json();

      setSummary(bData.summary || {});
      setBillings(bData.billings || []);
      setStudents(sData.students || []);

      setExpenseSummary(expData.summary || {});
      setExpenses(expData.expenses || []);

      setCashflow(cfData.cashflow || {});
    } catch (err) {
      console.error('Error loading financial data:', err);
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

  // Student Billing Actions
  const handleCreateBillingSubmit = async (e) => {
    e.preventDefault();
    if (!newBilling.user_id) return alert('Selecione um aluno!');
    setCreatingBilling(true);
    try {
      const res = await fetch('/api/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBilling),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      setShowCreateBillingModal(false);
      setNewBilling({ user_id: '', amount: '150.00', due_date: new Date().toISOString().split('T')[0], payment_method: 'Pix', notes: '', is_recurring: false });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingBilling(false);
    }
  };

  const handlePaidBillingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaidBilling) return;
    setSavingPaidBilling(true);
    try {
      const res = await fetch(`/api/billings/${selectedPaidBilling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString(),
          receipt_generated: true,
          notes: paidBillingNotes || selectedPaidBilling.notes,
          proof_base64: paidBillingProofBase64 || undefined,
          proof_filename: paidBillingProofFilename || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erro ao registrar pagamento');
      setShowPaidBillingModal(false);
      setSelectedPaidBilling(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPaidBilling(false);
    }
  };

  // Expense Actions
  const handleCreateExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.due_date) {
      return alert('Preencha os campos obrigatórios!');
    }
    setCreatingExpense(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar despesa');

      setShowCreateExpenseModal(false);
      setNewExpense({ description: '', category: 'Estrutura & Custos Fixos', amount: '', due_date: new Date().toISOString().split('T')[0], payment_method: 'Pix', status: 'PENDING', notes: '', proof_base64: '', proof_filename: '', is_recurring: false, frequency: 'MONTHLY', due_day: '5', end_date: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingExpense(false);
    }
  };

  const handlePayExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayExpense) return;
    setPayingExpense(true);
    try {
      const res = await fetch(`/api/expenses/${selectedPayExpense.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: new Date().toISOString(),
          proof_base64: payExpenseProofBase64 || undefined,
          proof_filename: payExpenseProofFilename || undefined,
        })
      });
      if (!res.ok) throw new Error('Erro ao registrar baixa da despesa');

      setShowPayExpenseModal(false);
      setSelectedPayExpense(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayingExpense(false);
    }
  };

  const handleFileUpload = (e, setBase64, setFilename) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Arquivo muito grande! Máximo 5MB.');

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64(reader.result);
      setFilename(file.name);
    };
    reader.readAsDataURL(file);
  };

  const overdueBillings = billings.filter((b) => b.status === 'overdue');

  return (
    <div className="space-y-6">
      {/* Page Master Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Módulo Financeiro Central & Fluxo de Caixa
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão unificada de mensalidades de alunos (Entradas), despesas operacionais (Saídas) e fluxo de caixa.
          </p>
        </div>

        {/* Master Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateBillingModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cobrança de Aluno</span>
          </button>

          <button
            onClick={() => setShowCreateExpenseModal(true)}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold px-3.5 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all text-xs cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>+ Cadastrar Despesa</span>
          </button>
        </div>
      </div>

      {/* Month / Temporal Navigation Bar (Filtro Global do Mês) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Período Financeiro Ativo</span>
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
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {monthFilter === 'all' ? '🗓️ Mês Atual' : '🌐 Visão Geral (Todos)'}
          </button>
        </div>
      </div>

      {/* MASTER FINANCIAL OVERVIEW CARDS (Sempre Visíveis no Topo) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Card 1: Total Recebido */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 bg-emerald-950/10">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Total Recebido (Entradas)</span>
            <span className="text-lg font-extrabold text-emerald-400">
              R$ {parseFloat(summary.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Total a Receber */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/40 flex items-center gap-3 bg-cyan-950/20 shadow-md">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-bold block">Total a Receber</span>
            <span className="text-lg font-black text-cyan-300">
              R$ {parseFloat(summary.total_receber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 3: Total de Despesas */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3 bg-rose-950/10">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Despesas Pagas (Saídas)</span>
            <span className="text-lg font-extrabold text-rose-400">
              R$ {parseFloat(expenseSummary.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 4: Lucro Parcial Mensal */}
        <div className={`glass-panel p-4 rounded-2xl border flex items-center gap-3 ${
          cashflow.lucro_liquido >= 0 ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/40 bg-rose-950/20'
        }`}>
          <div className={`p-3 rounded-xl border shrink-0 ${
            cashflow.lucro_liquido >= 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold block text-emerald-300">Lucro Parcial Mensal</span>
            <span className={`text-lg font-black ${cashflow.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {parseFloat(cashflow.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR (iOS Segmented Controls Style) */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('entradas')}
          className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'entradas'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>💳 Mensalidades & Entradas ({billings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saidas')}
          className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'saidas'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>🔻 Despesas & Saídas ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fluxo')}
          className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'fluxo'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📊 Fluxo de Caixa & Destaques</span>
        </button>
      </div>

      {/* TAB 1: MENSALIDADES & ENTRADAS (COBRANÇAS DE ALUNOS) */}
      {activeTab === 'entradas' && (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueBillings.length > 0 && (
            <div className="glass-panel rounded-2xl border border-rose-500/40 p-5 space-y-3 bg-rose-950/10 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  🔴 Cobranças de Alunos Atrasadas ({overdueBillings.length})
                </h2>
                <span className="text-xs text-slate-400">Notifique os alunos via WhatsApp em 1 clique</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-rose-950/30 uppercase text-[10px] text-rose-300 font-semibold border-b border-rose-500/20">
                    <tr>
                      <th className="py-2.5 px-3">Aluno</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-500/10">
                    {overdueBillings.map((b) => (
                      <tr key={b.id}>
                        <td 
                          className="py-2.5 px-3 font-bold text-white flex items-center gap-2.5 cursor-pointer group hover:text-emerald-400 transition-colors"
                          onClick={() => openStudentProfile(b)}
                          title="Clique para ver a ficha/perfil do aluno"
                        >
                          {b.photo_base64 ? (
                            <img
                              src={b.photo_base64}
                              alt={b.first_name || b.username}
                              className="w-7 h-7 rounded-full object-cover border border-rose-500/40 shrink-0 group-hover:border-emerald-400 transition-colors"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 group-hover:border-emerald-400">
                              {b.first_name?.[0] || b.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="group-hover:underline">{b.first_name ? `${b.first_name} ${b.last_name || ''}` : b.username}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">@{b.username}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-extrabold text-rose-400">R$ {parseFloat(b.amount).toFixed(2)}</td>
                        <td className="py-2 px-3 font-mono">{String(b.due_date).split('T')[0]}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedPaidBilling(b);
                                setShowPaidBillingModal(true);
                              }}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] shadow-md transition-all cursor-pointer flex items-center gap-1"
                              title="Dar baixa no pagamento desta mensalidade"
                            >
                              <CheckCircle2 className="w-3 h-3 text-slate-950" />
                              <span>Dar Baixa</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWaBilling(b);
                                setWaMessage(`Olá ${b.first_name || 'Aluno'}! Constamos uma pendência de R$ ${parseFloat(b.amount).toFixed(2)} referente à mensalidade com vencimento em ${String(b.due_date).split('T')[0]}.`);
                                setShowWaModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-[10px] shadow-sm transition-all cursor-pointer flex items-center gap-1"
                              title="Enviar lembrete por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-400" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Billings Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar aluno ou WhatsApp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white w-full focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
              >
                <option value="">Todos os Status de Cobrança</option>
                <option value="pending">🟡 Pendentes</option>
                <option value="charged">🟣 Cobrados (Lembrete)</option>
                <option value="paid">🟢 Pagos</option>
                <option value="overdue">🔴 Atrasados</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Aluno</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Forma</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">Carregando mensalidades...</td></tr>
                  ) : billings.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma mensalidade encontrada.</td></tr>
                  ) : (
                    billings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40">
                        <td 
                          className="py-3 px-4 font-bold text-white flex items-center gap-2.5 cursor-pointer group hover:text-emerald-400 transition-colors"
                          onClick={() => openStudentProfile(b)}
                          title="Clique para ver a ficha/perfil do aluno"
                        >
                          {b.photo_base64 ? (
                            <img
                              src={b.photo_base64}
                              alt={b.first_name || b.username}
                              className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0 group-hover:border-emerald-400 transition-colors"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 group-hover:border-emerald-400">
                              {b.first_name?.[0] || b.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="group-hover:underline">{b.first_name ? `${b.first_name} ${b.last_name || ''}` : b.username}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">@{b.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{String(b.due_date).split('T')[0]}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-400 text-sm">R$ {parseFloat(b.amount).toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-400">{b.payment_method || 'Pix'}</td>
                        <td className="py-3 px-4">
                          {getBillingStatusBadge(b.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {b.status !== 'paid' && (
                              <button
                                onClick={() => { setSelectedPaidBilling(b); setShowPaidBillingModal(true); }}
                                className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px]"
                              >
                                Dar Baixa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DESPESAS & SAÍDAS (CONTAS A PAGAR) */}
      {activeTab === 'saidas' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar despesa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white w-full focus:border-rose-500"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-rose-500"
              >
                <option value="">Todas as Categorias</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

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
                  {expenses.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhuma despesa registrada.</td></tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-mono text-slate-400">{String(exp.due_date).split('T')[0]}</td>
                        <td className="py-3 px-4 font-bold text-white">{exp.description}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">{exp.category}</span></td>
                        <td className="py-3 px-4 text-slate-400">{exp.payment_method}</td>
                        <td className="py-3 px-4 font-extrabold text-rose-400 text-sm">-R$ {parseFloat(exp.amount).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {getExpenseStatusBadge(exp.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.status !== 'PAID' && (
                            <button
                              onClick={() => { setSelectedPayExpense(exp); setShowPayExpenseModal(true); }}
                              className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px]"
                            >
                              Dar Baixa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLUXO DE CAIXA & DESTAQUES */}
      {activeTab === 'fluxo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
              <span className="text-xs text-slate-400 uppercase font-bold block">Entradas Totais (Mensalidades)</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">R$ {parseFloat(cashflow.receitas || 0).toFixed(2)}</span>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10">
              <span className="text-xs text-slate-400 uppercase font-bold block">Saídas Totais (Despesas Pagas)</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">R$ {parseFloat(cashflow.despesas || 0).toFixed(2)}</span>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/10">
              <span className="text-xs text-cyan-300 uppercase font-bold block">Ponto de Equilíbrio (Break-Even)</span>
              <span className="text-2xl font-black text-cyan-300 mt-1 block">~{cashflow.alunos_ponto_equilibrio || 0} alunos</span>
              <span className="text-[10px] text-slate-400 block mt-1">Alunos de R$ 150/mês para cobrir o custo fixo</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR COBRANÇA ALUNO */}
      {showCreateBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Criar Nova Cobrança de Aluno</h3>
              <button onClick={() => setShowCreateBillingModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateBillingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Aluno *</label>
                <select
                  required
                  value={newBilling.user_id}
                  onChange={(e) => setNewBilling({ ...newBilling, user_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Selecione o aluno...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={newBilling.amount} onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vencimento *</label>
                  <input type="date" required value={newBilling.due_date} onChange={(e) => setNewBilling({ ...newBilling, due_date: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateBillingModal(false)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800">Cancelar</button>
                <button type="submit" disabled={creatingBilling} className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500">Salvar Cobrança</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR DESPESA */}
      {showCreateExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Cadastrar Nova Despesa (Saída)</h3>
              <button onClick={() => setShowCreateExpenseModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição *</label>
                <input type="text" required value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Ex: Aluguel, Conta de Luz..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-rose-400 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vencimento *</label>
                  <input type="date" required value={newExpense.due_date} onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateExpenseModal(false)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800">Cancelar</button>
                <button type="submit" disabled={creatingExpense} className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-rose-500">Salvar Despesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL FICHA / PERFIL RÁPIDO DO ALUNO */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">Perfil do Aluno</h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student Card Header */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800">
              {viewingStudent.photo_base64 ? (
                <img
                  src={viewingStudent.photo_base64}
                  alt={viewingStudent.username}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-extrabold text-emerald-400 text-2xl shrink-0">
                  {viewingStudent.first_name?.[0] || viewingStudent.username?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-white">
                    {viewingStudent.first_name} {viewingStudent.last_name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">@{viewingStudent.username}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {viewingStudent.fase_shape && (
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                      {viewingStudent.fase_shape}
                    </span>
                  )}
                  {viewingStudent.nivel_treino && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                      {viewingStudent.nivel_treino}
                    </span>
                  )}
                  {(viewingStudent.objetivo_principal || viewingStudent.goal) && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                      {viewingStudent.objetivo_principal || viewingStudent.goal}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact Highlight Banner */}
            {viewingStudent.contato_emergencia_nome && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[9px] block">Contato de Emergência</span>
                    <span className="font-bold text-white text-xs">
                      {viewingStudent.contato_emergencia_nome}
                      {viewingStudent.contato_emergencia_parentesco ? ` (${viewingStudent.contato_emergencia_parentesco})` : ''}
                    </span>
                  </div>
                </div>
                {viewingStudent.contato_emergencia_telefone && (
                  <a
                    href={`https://wa.me/${viewingStudent.contato_emergencia_telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 text-xs shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{viewingStudent.contato_emergencia_telefone}</span>
                  </a>
                )}
              </div>
            )}

            {/* Health Restrictions & Safety Badges */}
            <div className="space-y-2 text-xs">
              {viewingStudent.restricoes_articulares && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-amber-400 block text-[11px] mb-1">Restrições Articulares:</span>
                  <span className="text-slate-300 font-semibold">
                    {Array.isArray(viewingStudent.restricoes_articulares) ? viewingStudent.restricoes_articulares.join(', ') : viewingStudent.restricoes_articulares}
                  </span>
                </div>
              )}

              {viewingStudent.condicoes_cardio_metabolicas && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-rose-400 block text-[11px] mb-1">Condições Cardiovasculares:</span>
                  <span className="text-slate-300 font-semibold">
                    {Array.isArray(viewingStudent.condicoes_cardio_metabolicas) ? viewingStudent.condicoes_cardio_metabolicas.join(', ') : viewingStudent.condicoes_cardio_metabolicas}
                  </span>
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Link
                href={`/dashboard/students?id=${viewingStudent.id}&search=${encodeURIComponent(viewingStudent.first_name || viewingStudent.username)}&openModal=true`}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Ficha Completa na Gestão</span>
              </Link>

              {viewingStudent.whatsapp && (
                <a
                  href={`https://wa.me/${viewingStudent.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp do Aluno</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

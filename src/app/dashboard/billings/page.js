'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, CheckCircle2, AlertCircle, Clock, MessageCircle, FileText, Download, Eye, 
  Trash2, Search, DollarSign, Send, Filter, Printer, BellRing, Upload, Calendar, Check, Repeat, UserX, AlertTriangle, Pencil 
} from 'lucide-react';

export default function BillingsPage() {
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0, total_charged: 0, total_overdue: 0 });
  const [billings, setBillings] = useState([]);
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Billing Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBilling, setNewBilling] = useState({
    user_id: '',
    amount: '150.00',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Pix',
    notes: '',
    is_recurring: false,
  });
  const [creating, setCreating] = useState(false);

  // Edit Billing Modal (Recurring Scope & Paid Confirmation)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    due_date: '',
    notes: '',
    payment_method: 'Pix',
    scope: 'single',
  });
  const [editStep, setEditStep] = useState('form'); // 'form' | 'confirm'
  const [savingEdit, setSavingEdit] = useState(false);

  // Transform to Monthly Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedConvertBilling, setSelectedConvertBilling] = useState(null);
  const [createNextMonthOption, setCreateNextMonthOption] = useState(true);
  const [converting, setConverting] = useState(false);

  // WhatsApp Reminder Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [selectedWaBilling, setSelectedWaBilling] = useState(null);
  const [waMessage, setWaMessage] = useState('');

  // Mark as Charged Modal
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedChargeBilling, setSelectedChargeBilling] = useState(null);
  const [remindDays, setRemindDays] = useState('3');
  const [customRemindDate, setCustomRemindDate] = useState('');
  const [chargeNotes, setChargeNotes] = useState('');
  const [charging, setCharging] = useState(false);

  // Mark as Paid Modal (with Optional Proof Upload)
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [selectedPaidBilling, setSelectedPaidBilling] = useState(null);
  const [paidProofBase64, setPaidProofBase64] = useState('');
  const [paidProofFilename, setPaidProofFilename] = useState('');
  const [paidNotes, setPaidNotes] = useState('');
  const [savingPaid, setSavingPaid] = useState(false);

  // Proof Viewer Modal
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`/api/billings?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch('/api/students'),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();

      setSummary(bData.summary || { total_paid: 0, total_pending: 0, total_charged: 0, total_overdue: 0 });
      setBillings(bData.billings || []);
      setStudents(sData.students || []);
    } catch (err) {
      console.error('Error loading billings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBilling = async (e) => {
    e.preventDefault();
    if (!newBilling.user_id) return alert('Selecione um aluno!');
    setCreating(true);

    try {
      const res = await fetch('/api/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBilling),
      });
      const data = await res.json();

      if (res.status === 409 || data.duplicate) {
        alert(data.error || 'Já existe uma cobrança vinculada a este aluno para este período!');
        setShowCreateModal(false);
        loadData();
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      setShowCreateModal(false);
      setNewBilling({
        user_id: '',
        amount: '150.00',
        due_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        notes: '',
        is_recurring: false,
      });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsChargedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChargeBilling) return;

    setCharging(true);
    try {
      const res = await fetch(`/api/billings/${selectedChargeBilling.id}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remind_days: remindDays !== 'custom' ? remindDays : null,
          remind_at: remindDays === 'custom' ? customRemindDate : null,
          charge_notes: chargeNotes,
        }),
      });

      if (!res.ok) throw new Error('Erro ao registrar cobrança feita');

      setShowChargeModal(false);
      setSelectedChargeBilling(null);
      setChargeNotes('');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCharging(false);
    }
  };

  const handlePaidSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaidBilling) return;

    setSavingPaid(true);
    try {
      const res = await fetch(`/api/billings/${selectedPaidBilling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString(),
          receipt_generated: true,
          notes: paidNotes || selectedPaidBilling.notes,
          proof_base64: paidProofBase64 || undefined,
          proof_filename: paidProofFilename || undefined,
        }),
      });

      if (!res.ok) throw new Error('Erro ao registrar pagamento');

      setShowPaidModal(false);
      setSelectedPaidBilling(null);
      setPaidProofBase64('');
      setPaidProofFilename('');
      setPaidNotes('');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPaid(false);
    }
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConvertBilling) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/billings/${selectedConvertBilling.id}/convert-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createNextMonth: createNextMonthOption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao converter cobrança em mensalidade');

      setShowConvertModal(false);
      setSelectedConvertBilling(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  };

  const openEditModal = (b) => {
    setEditingBilling(b);
    setEditFormData({
      amount: b.amount ? String(b.amount) : '150.00',
      due_date: b.due_date ? String(b.due_date).split('T')[0] : new Date().toISOString().split('T')[0],
      notes: b.notes || '',
      payment_method: b.payment_method || 'Pix',
      scope: 'single',
    });
    setEditStep('form');
    setShowEditModal(true);
  };

  const handleEditFormSubmit = (e) => {
    e.preventDefault();
    setEditStep('confirm');
  };

  const handleSaveEditSubmit = async () => {
    if (!editingBilling) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/billings/${editingBilling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: editFormData.amount,
          due_date: editFormData.due_date,
          notes: editFormData.notes,
          payment_method: editFormData.payment_method,
          scope: editFormData.scope,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar cobrança');

      setShowEditModal(false);
      setEditingBilling(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const getAffectedBillings = () => {
    if (!editingBilling) return [];
    if (editingBilling.recurrence_id) {
      if (editFormData.scope === 'all') {
        return billings.filter((b) => b.recurrence_id === editingBilling.recurrence_id);
      } else if (editFormData.scope === 'future') {
        const targetDueDate = String(editingBilling.due_date).split('T')[0];
        return billings.filter(
          (b) => b.recurrence_id === editingBilling.recurrence_id && String(b.due_date).split('T')[0] >= targetDueDate
        );
      }
    }
    return [editingBilling];
  };

  const handleCancelStudentEnrollmentFromBilling = async (userId, studentName) => {
    if (!confirm(`Confirmar o cancelamento da matrícula de ${studentName}? Todas as próximas mensalidades pendentes serão canceladas.`)) return;
    try {
      const res = await fetch(`/api/students/${userId}/cancel-enrollment`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao cancelar matrícula');
      alert(`Matrícula de ${studentName} cancelada com sucesso!`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaidProofFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPaidProofBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteBilling = async (id) => {
    if (!confirm('Deseja realmente excluir esta cobrança?')) return;
    try {
      const res = await fetch(`/api/billings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir cobrança');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openWaReminder = (billing) => {
    const name = billing.first_name || billing.username;
    const amountStr = parseFloat(billing.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const dueDateStr = new Date(billing.due_date).toLocaleDateString('pt-BR');
    const statusText = billing.status === 'overdue' ? 'está em atraso' : 'está pendente';

    const defaultMsg = `Olá, ${name}! Sua mensalidade de R$ ${amountStr}, com vencimento em ${dueDateStr}, ${statusText}. Caso já tenha realizado o pagamento, por favor envie o comprovante.`;

    setSelectedWaBilling(billing);
    setWaMessage(defaultMsg);
    setShowWaModal(true);
  };

  const sendWaMessage = () => {
    if (!selectedWaBilling) return;
    const rawPhone = selectedWaBilling.whatsapp?.replace(/\D/g, '');
    if (!rawPhone) return alert('Aluno não possui WhatsApp cadastrado!');

    const formattedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const encodedText = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank');
    setShowWaModal(false);
  };

  const overdueBillings = billings.filter((b) => b.status === 'overdue');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Módulo de Cobranças & Mensalidades
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gerencie pagamentos, controle recorrências de 12 meses e envie lembretes por WhatsApp.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all text-sm cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Cobrança</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4 bg-emerald-950/10">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Total Recebido</span>
            <span className="text-xl font-extrabold text-emerald-400">
              R$ {parseFloat(summary.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4 bg-amber-950/10">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Pendentes</span>
            <span className="text-xl font-extrabold text-amber-400">
              R$ {parseFloat(summary.total_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4 bg-amber-900/10">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Cobrados (Lembrete)</span>
            <span className="text-xl font-extrabold text-amber-300">
              R$ {parseFloat(summary.total_charged || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4 bg-rose-950/20">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Atrasados</span>
            <span className="text-xl font-extrabold text-rose-400">
              R$ {parseFloat(summary.total_overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* OVERDUE SECTION */}
      {overdueBillings.length > 0 && (
        <div className="glass-panel rounded-2xl border border-rose-500/40 p-6 space-y-4 bg-rose-950/10 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              🔴 Cobranças Atrasadas ({overdueBillings.length})
            </h2>
            <span className="text-xs text-slate-400">Envie lembrete via WhatsApp em 1 clique</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-rose-950/30 uppercase text-[10px] text-rose-300 font-semibold border-b border-rose-500/20">
                <tr>
                  <th className="py-3 px-4">Aluno</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-500/10">
                {overdueBillings.map((b) => (
                  <tr key={b.id} className="hover:bg-rose-900/20 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-bold text-rose-400">
                        {b.first_name?.[0] || b.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span>{b.first_name} {b.last_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">@{b.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-300">
                      R$ {parseFloat(b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {new Date(b.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChargeBilling(b);
                          setShowChargeModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer border border-amber-500/30"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Lembrete</span>
                      </button>

                      {b.whatsapp && (
                        <button
                          onClick={() => openWaReminder(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Billings Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === '' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter('charged')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'charged' ? 'bg-amber-400/20 text-amber-300 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cobrados (Lembrete)
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pagas
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'overdue' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Atrasadas
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno ou cobrança..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando mensalidades...</div>
        ) : billings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Nenhuma cobrança encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Valor (R$)</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Situação & Recorrência</th>
                  <th className="py-3.5 px-4 text-center">Comprovante</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {billings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {b.first_name} {b.last_name}
                      <span className="text-[10px] text-slate-500 block font-mono">@{b.username}</span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-white">
                      R$ {parseFloat(b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {new Date(b.due_date).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {b.status === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                          </span>
                        ) : b.status === 'charged' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold text-[11px] inline-flex items-center gap-1">
                            <BellRing className="w-3.5 h-3.5" /> Cobrado (Lembrete)
                          </span>
                        ) : b.status === 'overdue' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[11px] inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Atrasado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px] inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pendente
                          </span>
                        )}

                        {b.is_recurring && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold block w-fit">
                            🔄 Recorrente
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {b.proof_base64 ? (
                        <button
                          onClick={() => {
                            setSelectedProof(b);
                            setShowProofModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Anexo
                        </button>
                      ) : (
                        <span className="text-slate-600 italic">Sem anexo</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {(b.status === 'pending' || b.status === 'overdue') && b.whatsapp && (
                        <button
                          onClick={() => openWaReminder(b)}
                          title="Enviar Mensagem de Cobrança via WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}

                      {b.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedChargeBilling(b);
                              setShowChargeModal(true);
                            }}
                            title="Marcar Cobrança Feita & Lembrete"
                            className="p-1.5 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                          >
                            <BellRing className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPaidBilling(b);
                              setShowPaidModal(true);
                            }}
                            title="Marcar como Pago (Recebido)"
                            className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {b.status === 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedReceipt(b);
                            setShowReceiptModal(true);
                          }}
                          title="Gerar Recibo"
                          className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                        >
                          <Printer className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(b)}
                        title="Editar Cobrança"
                        className="p-1.5 rounded-lg text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBilling(b.id)}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NEW BILLING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Criar Nova Cobrança
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBilling} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Selecione o Aluno *</label>
                <select
                  required
                  value={newBilling.user_id}
                  onChange={(e) => setNewBilling({ ...newBilling, user_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                >
                  <option value="">-- Selecionar Aluno --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (@{s.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBilling.amount}
                    onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-emerald-400 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={newBilling.due_date}
                    onChange={(e) => setNewBilling({ ...newBilling, due_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição / Tipo de Cobrança</label>
                <input
                  type="text"
                  value={newBilling.notes}
                  onChange={(e) => setNewBilling({ ...newBilling, notes: e.target.value })}
                  placeholder="Ex: Mensalidade, Taxa de Matrícula..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <select
                  value={newBilling.payment_method}
                  onChange={(e) => setNewBilling({ ...newBilling, payment_method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              {/* Toggle Recorrência */}
              <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all">
                <input
                  type="checkbox"
                  checked={newBilling.is_recurring}
                  onChange={(e) => setNewBilling({ ...newBilling, is_recurring: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="font-bold text-white block">☐ Cobrança recorrente (12 Meses)</span>
                  <span className="text-[10px] text-slate-400 block">
                    Criar mensalidades automaticamente a cada mês por 12 meses no mesmo dia.
                  </span>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  className="px-5 py-2 rounded-xl font-bold text-black bg-[#D4AF37] hover:bg-[#C5A059] shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  {creating ? 'Criando...' : 'Criar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP REMINDER */}
      {showWaModal && selectedWaBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                Enviar Mensagem via WhatsApp
              </h3>
              <button onClick={() => setShowWaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Aluno: {selectedWaBilling.first_name} {selectedWaBilling.last_name}</span>
                <span className="text-emerald-400 block font-mono">WhatsApp: {selectedWaBilling.whatsapp}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mensagem Pronta (Editável):
                </label>
                <textarea
                  rows={6}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowWaModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendWaMessage}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MARK AS CHARGED */}
      {showChargeModal && selectedChargeBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                Marcar Cobrança Feita & Definir Lembrete
              </h3>
              <button onClick={() => setShowChargeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleMarkAsChargedSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-white block">
                  Aluno: {selectedChargeBilling.first_name} {selectedChargeBilling.last_name}
                </span>
                <span className="text-amber-400 font-bold block">
                  Valor: R$ {parseFloat(selectedChargeBilling.amount).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Me Lembre em (Dias):</label>
                <select
                  value={remindDays}
                  onChange={(e) => setRemindDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400"
                >
                  <option value="2">Em 2 dias</option>
                  <option value="3">Em 3 dias</option>
                  <option value="5">Em 5 dias</option>
                  <option value="7">Em 7 dias</option>
                  <option value="custom">Data Personalizada...</option>
                </select>
              </div>

              {remindDays === 'custom' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data Específica do Lembrete</label>
                  <input
                    type="date"
                    required
                    value={customRemindDate}
                    onChange={(e) => setCustomRemindDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações da Cobrança (Opcional)</label>
                <textarea
                  rows={2}
                  value={chargeNotes}
                  onChange={(e) => setChargeNotes(e.target.value)}
                  placeholder="Ex: Mandei mensagem no WhatsApp..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={charging}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300"
                >
                  {charging ? 'Salvando...' : 'Salvar Lembrete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MARK AS PAID */}
      {showPaidModal && selectedPaidBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Registrar Pagamento Recebido
              </h3>
              <button onClick={() => setShowPaidModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePaidSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-white block">
                  Aluno: {selectedPaidBilling.first_name} {selectedPaidBilling.last_name}
                </span>
                <span className="text-emerald-400 font-extrabold text-sm block">
                  Valor Pago: R$ {parseFloat(selectedPaidBilling.amount).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Anexar Comprovante (Imagem/PDF - Opcional):
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofFileUpload}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 focus:outline-none"
                />
              </div>

              {paidProofFilename && (
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Comprovante: {paidProofFilename}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações do Pagamento (Opcional)</label>
                <input
                  type="text"
                  value={paidNotes}
                  onChange={(e) => setPaidNotes(e.target.value)}
                  placeholder="Ex: Pix recebido..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaidModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPaid}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  {savingPaid ? 'Confirmando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PROOF VIEWER */}
      {showProofModal && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Comprovante Enviado por {selectedProof.first_name}
              </h3>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              {selectedProof.proof_base64?.startsWith('data:image') || !selectedProof.proof_base64?.startsWith('data:application/pdf') ? (
                <img
                  src={selectedProof.proof_base64}
                  alt="Comprovante"
                  className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-800 bg-slate-950"
                />
              ) : (
                <iframe
                  src={selectedProof.proof_base64}
                  className="w-full h-80 rounded-xl border border-slate-800"
                  title="PDF Viewer"
                />
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <a
                  href={selectedProof.proof_base64}
                  download={selectedProof.proof_filename || 'comprovante.jpg'}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo</span>
                </a>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedPaidBilling(selectedProof);
                    setShowPaidModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RECEIPT */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">RECIBO DE PAGAMENTO</h2>
              <p className="text-xs text-slate-500">Iron Solder Gym &bull; Gestão de Treinos</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Recebido de:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.first_name} {selectedReceipt.last_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Valor Pago:</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  R$ {parseFloat(selectedReceipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Referente a:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.notes || 'Mensalidade da Academia'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Forma de Pagamento:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Data de Vencimento:</span>
                <span>{new Date(selectedReceipt.due_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-500">Data do Pagamento:</span>
                <span className="font-bold">{new Date(selectedReceipt.paid_date || Date.now()).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="pt-6 border-t text-center">
              <div className="w-48 mx-auto border-b border-slate-900 mb-1"></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                Assinatura do Responsável
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT BILLING WITH RECURRENCE SCOPE & PAID CONFIRMATION */}
      {showEditModal && editingBilling && (() => {
        const affectedList = getAffectedBillings();
        const affectedCount = affectedList.length;
        const paidCount = affectedList.filter((b) => b.status === 'paid').length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-cyan-400" />
                    Editar Cobrança
                  </h2>
                  <p className="text-xs text-slate-400">
                    Aluno: <strong className="text-white">{editingBilling.first_name} {editingBilling.last_name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBilling(null);
                  }}
                  className="text-slate-500 hover:text-white transition-all text-base font-bold"
                >
                  ✕
                </button>
              </div>

              {editStep === 'form' ? (
                <form onSubmit={handleEditFormSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-extrabold text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.due_date}
                      onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Descrição / Tipo de Cobrança</label>
                    <input
                      type="text"
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Ex: Mensalidade Musculação"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Forma de Pagamento</label>
                    <select
                      value={editFormData.payment_method}
                      onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="Dinheiro">Dinheiro (Espécie)</option>
                    </select>
                  </div>

                  {/* SCOPE SELECTION IF RECURRING */}
                  {(editingBilling.is_recurring || editingBilling.recurrence_id) && (
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <label className="block text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                        <Repeat className="w-4 h-4 text-purple-400" />
                        Como a alteração deve ser aplicada?
                      </label>

                      <div className="space-y-2">
                        <label className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                          editFormData.scope === 'single'
                            ? 'bg-purple-500/10 border-purple-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scope"
                              value="single"
                              checked={editFormData.scope === 'single'}
                              onChange={() => setEditFormData({ ...editFormData, scope: 'single' })}
                              className="accent-purple-500"
                            />
                            <span className="font-bold text-xs text-white">Somente esta cobrança</span>
                          </div>
                          <p className="text-[11px] text-slate-400 ml-5 mt-0.5">
                            A alteração afetará exclusivamente a cobrança selecionada.
                          </p>
                        </label>

                        <label className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                          editFormData.scope === 'future'
                            ? 'bg-purple-500/10 border-purple-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scope"
                              value="future"
                              checked={editFormData.scope === 'future'}
                              onChange={() => setEditFormData({ ...editFormData, scope: 'future' })}
                              className="accent-purple-500"
                            />
                            <span className="font-bold text-xs text-white">Esta e todas as cobranças futuras</span>
                          </div>
                          <p className="text-[11px] text-slate-400 ml-5 mt-0.5">
                            A alteração será aplicada a esta cobrança e a todas as posteriores desta mesma recorrência.
                          </p>
                        </label>

                        <label className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                          editFormData.scope === 'all'
                            ? 'bg-purple-500/10 border-purple-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scope"
                              value="all"
                              checked={editFormData.scope === 'all'}
                              onChange={() => setEditFormData({ ...editFormData, scope: 'all' })}
                              className="accent-purple-500"
                            />
                            <span className="font-bold text-xs text-white">Toda a recorrência</span>
                          </div>
                          <p className="text-[11px] text-slate-400 ml-5 mt-0.5">
                            A alteração será aplicada a todas as cobranças desta recorrência (anteriores, atuais e futuras).
                          </p>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingBilling(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20"
                    >
                      Avançar
                    </button>
                  </div>
                </form>
              ) : (
                /* CONFIRMATION STEP */
                <div className="space-y-5 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-slate-300">
                      Você está alterando <strong className="text-cyan-400 font-extrabold text-sm font-mono">{affectedCount} cobrança(s)</strong> {editingBilling.is_recurring || editingBilling.recurrence_id ? 'desta recorrência' : 'do sistema'}.
                    </p>
                    {editingBilling.is_recurring && (
                      <p className="text-[11px] text-slate-400">
                        Escopo escolhido: <strong className="text-purple-300 font-semibold">
                          {editFormData.scope === 'single' ? 'Somente esta cobrança' : editFormData.scope === 'future' ? 'Esta e todas as cobranças futuras' : 'Toda a recorrência'}
                        </strong>
                      </p>
                    )}
                  </div>

                  {paidCount > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2 text-amber-200">
                      <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Esta cobrança {paidCount > 1 ? `(${paidCount} neste grupo)` : ''} já foi paga.</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        Alterar o valor, data ou forma de pagamento de uma cobrança paga pode modificar o histórico financeiro.
                      </p>
                      <p className="text-xs font-bold text-amber-300">
                        Deseja realmente continuar?
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditStep('form')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveEditSubmit}
                      disabled={savingEdit}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      {savingEdit ? 'Salvando...' : 'Confirmar alteração'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

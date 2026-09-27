'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, CheckCircle2, AlertCircle, Clock, MessageCircle, FileText, Download, Eye, Trash2, Search, DollarSign, Send, Filter, Printer } from 'lucide-react';

export default function BillingsPage() {
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0, total_overdue: 0 });
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
  });
  const [creating, setCreating] = useState(false);

  // WhatsApp Reminder Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [selectedWaBilling, setSelectedWaBilling] = useState(null);
  const [waMessage, setWaMessage] = useState('');

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

      setSummary(bData.summary || { total_paid: 0, total_pending: 0, total_overdue: 0 });
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
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      setShowCreateModal(false);
      setNewBilling({ user_id: '', amount: '150.00', due_date: new Date().toISOString().split('T')[0], payment_method: 'Pix', notes: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsPaid = async (billing) => {
    if (!confirm(`Confirmar o pagamento de R$ ${billing.amount} para ${billing.first_name || billing.username}?`)) return;
    try {
      const res = await fetch(`/api/billings/${billing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paid_date: new Date().toISOString(), receipt_generated: true }),
      });
      if (!res.ok) throw new Error('Erro ao marcar cobrança como paga');
      loadData();
    } catch (err) {
      alert(err.message);
    }
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

  // Open WhatsApp Reminder Modal with pre-filled editable message
  const openWaReminder = (billing) => {
    const name = billing.first_name || billing.username;
    const amountStr = parseFloat(billing.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const dueDateStr = new Date(billing.due_date).toLocaleDateString('pt-BR');

    const defaultMsg = `Olá, ${name}! Tudo bem?\n\nIdentificamos que sua mensalidade de R$ ${amountStr}, com vencimento em ${dueDateStr}, está pendente.\n\nCaso já tenha realizado o pagamento, por favor envie o comprovante.\n\nObrigado!`;

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
          <p className="text-xs text-slate-400 mt-1">Gerencie pagamentos, envie lembretes via WhatsApp e confira comprovantes.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 bg-emerald-950/10">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Total Recebido</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              R$ {parseFloat(summary.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 bg-amber-950/10">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Pendente (A vencer)</span>
            <span className="text-2xl font-extrabold text-amber-400">
              R$ {parseFloat(summary.total_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 bg-rose-950/20">
          <div className="p-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Atrasado</span>
            <span className="text-2xl font-extrabold text-rose-400">
              R$ {parseFloat(summary.total_overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* OVERDUE SECTION: 🔴 Cobranças Atrasadas */}
      {overdueBillings.length > 0 && (
        <div className="glass-panel rounded-2xl border border-rose-500/40 p-6 space-y-4 bg-rose-950/10 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              🔴 Cobranças Atrasadas ({overdueBillings.length})
            </h2>
            <span className="text-xs text-slate-400">Envie o lembrete de cobrança direto no WhatsApp do aluno</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-rose-950/30 uppercase text-[10px] text-rose-300 font-semibold border-b border-rose-500/20">
                <tr>
                  <th className="py-3 px-4">Aluno</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Cobrar via WhatsApp</th>
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
                    <td className="py-3.5 px-4 text-right">
                      {b.whatsapp ? (
                        <button
                          onClick={() => openWaReminder(b)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sem número</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Billings List Section with Tabs & Search */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === '' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pagas
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'overdue' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Atrasadas
            </button>
          </div>

          {/* Search bar */}
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

        {/* Billings Table */}
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
                  <th className="py-3.5 px-4">Forma</th>
                  <th className="py-3.5 px-4 text-center">Situação</th>
                  <th className="py-3.5 px-4 text-center">Comprovante Pix</th>
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
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.status === 'paid' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
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
                      {b.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(b)}
                          title="Marcar como Pago"
                          className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {b.status === 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedReceipt(b);
                            setShowReceiptModal(true);
                          }}
                          title="Gerar Recibo de Pagamento"
                          className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                        >
                          <Printer className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
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

      {/* Modal: New Billing Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Criar Nova Cobrança / Mensalidade
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
                  <label className="block font-semibold text-slate-300 mb-1">Valor da Mensalidade (R$) *</label>
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
                <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento Preferencial</label>
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

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  value={newBilling.notes}
                  onChange={(e) => setNewBilling({ ...newBilling, notes: e.target.value })}
                  placeholder="Ex: Mensalidade de Outubro/2026..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

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
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  {creating ? 'Criando...' : 'Criar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Custom Message Sender */}
      {showWaModal && selectedWaBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                Enviar Lembrete de Cobrança via WhatsApp
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
                  Mensagem Pronta (Você pode editar antes de enviar):
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

      {/* Modal: View Proof Attachment */}
      {showProofModal && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Comprovante Enviado por {selectedProof.first_name}
              </h3>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              {selectedProof.proof_base64?.startsWith('data:image') || selectedProof.proof_base64?.startsWith('data:application/pdf') === false ? (
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
                  onClick={() => handleMarkAsPaid(selectedProof)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Confirmar e Marcar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Payment Receipt */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">RECIBO DE PAGAMENTO</h2>
              <p className="text-xs text-slate-500">Academia Pro &bull; Gestão de Treinos</p>
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
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

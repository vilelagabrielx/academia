'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Dumbbell, FileText, Plus, MessageCircle, ArrowUpRight, Search, Activity, 
  UserPlus, CheckCircle2, Eye, User, Scale, Droplet, Target, Calendar, CreditCard, Trash2, RefreshCw, AlertTriangle 
} from 'lucide-react';

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const [stdRes, exRes, rtRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/exercises'),
        fetch('/api/routines'),
      ]);
      const stdData = await stdRes.json();
      const exData = await exRes.json();
      const rtData = await rtRes.json();

      setStudents(stdData.students || []);
      setExercises(exData.exercises || []);
      setRoutines(rtData.routines || []);
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
      alert(err.message);
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
        alert(data.error || 'Já existe uma cobrança vinculada a este aluno para este período!');
        setShowRenewModal(false);
        loadData();
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      alert('Cobrança criada com sucesso!');
      setShowRenewModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setRenewing(false);
    }
  };

  const openWhatsAppForBilling = (student) => {
    const rawPhone = student.whatsapp?.replace(/\D/g, '');
    if (!rawPhone) return alert('Aluno não possui número de WhatsApp cadastrado!');

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

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno ${name}?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir aluno');
      setViewingStudent(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelEnrollment = async (studentId, studentName) => {
    if (!confirm(`Tem certeza que deseja CANCELAR A MATRÍCULA de ${studentName}? Todas as mensalidades futuras pendentes serão canceladas.`)) return;
    try {
      const res = await fetch(`/api/students/${studentId}/cancel-enrollment`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao cancelar matrícula');
      alert('Matrícula cancelada com sucesso!');
      setViewingStudent(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
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
              Gerencie seus alunos, controle mensalidades e acompanhe a evolução dos treinos em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>Novo Aluno</span>
            </button>
            <Link
              href="/dashboard/routines/new"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-3 rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Treino</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Total de Alunos</span>
            <span className="text-3xl font-extrabold text-white">{students.length}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Treinos Criados</span>
            <span className="text-3xl font-extrabold text-white">{routines.length}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Exercícios no Banco</span>
            <span className="text-3xl font-extrabold text-white">{exercises.length}</span>
          </div>
        </div>
      </div>

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
          <div className="py-12 text-center text-slate-500 text-sm">Nenhum aluno encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Aluno</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4 text-center">Situação da Cobrança</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
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
                          : 'hover:bg-slate-800/50'
                      }`}
                      onClick={() => setViewingStudent(student)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-3">
                        {student.photo_base64 ? (
                          <img
                            src={student.photo_base64}
                            alt={student.username}
                            className="w-9 h-9 rounded-full object-cover border border-emerald-500/40 group-hover:border-emerald-400"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
                            {student.first_name?.[0] || student.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="block font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
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

                      {/* 4 Student Billing Status Badges */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {status === 'sem_cobranca' && (
                          <div className="group relative inline-block">
                            <span className="px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 cursor-help shadow-sm">
                              🔴 Sem cobrança vinculada
                            </span>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-slate-200 text-[10px] rounded-lg shadow-xl border border-slate-700 z-50 text-center">
                              Este aluno não possui uma cobrança válida para o mês atual.
                            </div>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome de Usuário (Login)</label>
                <input
                  type="text"
                  required
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="joao_silva"
                />
              </div>

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
    </div>
  );
}

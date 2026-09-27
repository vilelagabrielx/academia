'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, Search, MessageCircle, Edit3, Trash2, ArrowUpRight, Camera, Key, Check, 
  AlertCircle, ChevronRight, ChevronLeft, Heart, Dumbbell, Calendar, CreditCard, Droplet, Target, Scale, User, FileText, CheckCircle2, Clock
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Student Profile Detail View Modal State (Ao clicar no aluno)
  const [viewingStudent, setViewingStudent] = useState(null);

  // Multi-step Registration Wizard Modal State
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    whatsapp: '',
    password: '',
    photo_base64: '',
    age: '',
    height: '',
    current_weight: '',
    blood_type: '',
    goal: 'Hipertrofia',
    training_days: 'Seg, Quar, Sex',
    initial_amount: '150.00',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateWizard = () => {
    setEditingStudentId(null);
    setWizardStep(1);
    setErrorMsg('');
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      whatsapp: '',
      password: '',
      photo_base64: '',
      age: '',
      height: '',
      current_weight: '',
      blood_type: 'O+',
      goal: 'Hipertrofia',
      training_days: 'Segunda, Quarta, Sexta',
      initial_amount: '150.00',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowWizardModal(true);
  };

  const handleOpenEditWizard = (student) => {
    setEditingStudentId(student.id);
    setWizardStep(1);
    setErrorMsg('');
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      username: student.username || '',
      email: student.email || '',
      whatsapp: student.whatsapp || '',
      password: '',
      photo_base64: student.photo_base64 || '',
      age: student.age || '',
      height: student.height || '',
      current_weight: student.current_weight || '',
      blood_type: student.blood_type || 'O+',
      goal: student.goal || 'Hipertrofia',
      training_days: student.training_days || 'Segunda, Quarta, Sexta',
      initial_amount: student.latest_billing_amount || '150.00',
      due_date: student.latest_billing_due_date ? new Date(student.latest_billing_due_date).toISOString().split('T')[0] : '',
    });
    setViewingStudent(null);
    setShowWizardModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData((prev) => ({ ...prev, photo_base64: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWizard = async (e) => {
    if (e) e.preventDefault();
    if (!formData.first_name && !editingStudentId) {
      return setErrorMsg('O Nome do aluno é o único campo obrigatório!');
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const cleanPhone = formData.whatsapp.replace(/\D/g, '');
      const formattedPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '';

      const payload = {
        ...formData,
        whatsapp: formattedPhone,
      };

      const url = editingStudentId ? `/api/students/${editingStudentId}` : '/api/students';
      const method = editingStudentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar aluno');

      setShowWizardModal(false);
      loadStudents();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno ${name}?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir aluno');
      setViewingStudent(null);
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Gestão de Alunos
          </h1>
          <p className="text-xs text-slate-400 mt-1">Clique no aluno para ver o perfil completo ou cadastre um novo aluno em poucos segundos.</p>
        </div>
        <button
          onClick={handleOpenCreateWizard}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Aluno</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou objetivo..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={loadStudents}
          className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all font-semibold"
        >
          Buscar
        </button>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando alunos...</div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Nenhum aluno cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Aluno (Clique para Detalhes)</th>
                  <th className="py-3.5 px-4">Objetivo</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4 text-center">Mensalidade</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const phone = student.whatsapp?.replace(/\D/g, '');
                  const waUrl = phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-800/50 transition-all cursor-pointer group"
                      onClick={() => setViewingStudent(student)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-3">
                        {student.photo_base64 ? (
                          <img
                            src={student.photo_base64}
                            alt={student.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40 group-hover:border-emerald-400"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
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

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                          {student.goal || 'Geral'}
                        </span>
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

                      <td className="py-3.5 px-4 text-center">
                        {student.latest_billing_amount ? (
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            student.latest_billing_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : student.latest_billing_status === 'overdue'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            R$ {parseFloat(student.latest_billing_amount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Sem mensalidade</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/students/${student.id}/history`}
                          title="Ver Histórico de Treinos"
                          className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-emerald-400 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditWizard(student)}
                          title="Editar Aluno"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.first_name || student.username)}
                          title="Excluir Aluno"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* MODAL 1: STUDENT PROFILE DETAILS (AO CLICAR NO ALUNO) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Main Profile Header with Photo */}
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
                  <h2 className="text-2xl font-extrabold text-white">
                    {viewingStudent.first_name} {viewingStudent.last_name}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono block">@{viewingStudent.username}</span>
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

            {/* Grid Information Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              {/* Physical & Health */}
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

            {/* Financial History Card */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3 bg-slate-900/70">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Situação Financeira & Pagamentos
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Mensalidade Atual:</span>
                  <span className="text-base font-extrabold text-white">
                    {viewingStudent.latest_billing_amount
                      ? `R$ ${parseFloat(viewingStudent.latest_billing_amount).toFixed(2)}`
                      : 'Nenhuma criada'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Último Pagamento Realizado:</span>
                  <span className="text-sm font-bold text-emerald-400 block">
                    {viewingStudent.last_paid_amount
                      ? `R$ ${parseFloat(viewingStudent.last_paid_amount).toFixed(2)} (${new Date(viewingStudent.last_paid_date).toLocaleDateString('pt-BR')})`
                      : 'Sem registro recente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => handleDelete(viewingStudent.id, viewingStudent.first_name)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
              >
                Excluir Aluno
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => handleOpenEditWizard(viewingStudent)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
                >
                  Editar Cadastro
                </button>
                <Link
                  href={`/dashboard/students/${viewingStudent.id}/history`}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 flex items-center gap-1.5"
                >
                  <span>Ver Histórico de Treinos</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STEP-BY-STEP CADASTRO/EDIÇÃO DE ALUNO (WIZARD) */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
            {/* Header with Step Progress */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  {editingStudentId ? 'Editar Aluno' : 'Cadastrar Aluno (Passo a Passo)'}
                </h3>
                <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
                  Etapa {wizardStep} de 4 &bull; Apenas o Nome é obrigatório!
                </span>
              </div>
              <button onClick={() => setShowWizardModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Step Indicators Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => setWizardStep(step)}
                  className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                    wizardStep === step
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  Passo {step}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Step Contents */}
            <form onSubmit={handleSubmitWizard} className="space-y-4 text-xs">
              {/* STEP 1: DADOS BÁSICOS */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nome do Aluno * (Único Obrigatório)</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ex: João"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Sobrenome</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Silva"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">WhatsApp (DDD + N°)</label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="5511999999999"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Usuário de Login (Opcional)</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Deixe em branco para gerar automático"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Senha (Opcional)</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Deixe em branco para 123456"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DADOS FÍSICOS & SAÚDE */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Idade (anos)</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="25"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Peso Atual (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.current_weight}
                        onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                        placeholder="75.5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Altura (cm)</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="175"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tipo Sanguíneo</label>
                      <select
                        value={formData.blood_type}
                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      >
                        <option value="O+">O+</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="AB+">AB+</option>
                        <option value="O-">O-</option>
                        <option value="A-">A-</option>
                        <option value="B-">B-</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: TREINO & FOTO */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Objetivo do Aluno</label>
                    <select
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                    >
                      <option value="Hipertrofia">Hipertrofia (Ganho de Massa)</option>
                      <option value="Emagrecimento">Emagrecimento (Perda de Gordura)</option>
                      <option value="Condicionamento">Condicionamento Físico</option>
                      <option value="Força Bruta">Ganho de Força</option>
                      <option value="Saúde">Saúde & Bem-estar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Dias da Semana que Treina</label>
                    <input
                      type="text"
                      value={formData.training_days}
                      onChange={(e) => setFormData({ ...formData, training_days: e.target.value })}
                      placeholder="Ex: Seg, Qua, Sex"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    {formData.photo_base64 ? (
                      <img
                        src={formData.photo_base64}
                        alt="Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                        Escolher Foto de Perfil
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      <span className="text-[10px] text-slate-500 block mt-1">Imagens em baixa resolução são aceitas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FINANCEIRO INICIAL */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Valor Mensalidade (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.initial_amount}
                        onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">1º Vencimento</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  {wizardStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep((s) => s + 1)}
                      className="px-4 py-2 rounded-xl font-semibold text-slate-950 bg-slate-200 hover:bg-white flex items-center gap-1"
                    >
                      <span>Próximo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSubmitWizard}
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                  >
                    {submitting ? 'Salvando...' : editingStudentId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

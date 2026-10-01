'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PhoneInputWithContacts from '@/components/PhoneInputWithContacts';
import { compressImageFile } from '@/lib/imageCompression';
import {
  User, Dumbbell, Heart, CheckCircle2, AlertCircle, Camera, ChevronRight, ChevronLeft,
  Sparkles, ShieldCheck, Phone, Mail, Calendar, Activity, Scale, Award, Layers,
  Clock, Plus, X, Zap, Check, AlertTriangle
} from 'lucide-react';

const FASE_OPTIONS = ['Bulking', 'Cutting', 'Manutenção', 'Recomposição'];
const NIVEL_OPTIONS = ['Iniciante', 'Intermediário', 'Avançado / Atleta'];
const OBJETIVO_OPTIONS = ['Hipertrofia', 'Emagrecimento', 'Recomposição corporal', 'Ganho de força', 'Definição', 'Performance', 'Manutenção'];
const DIVISAO_OPTIONS = ['Full Body', 'Upper / Lower', 'Push / Pull / Legs', 'ABC', 'ABCD', 'ABCDE', 'Outro'];
const FREQUENCIA_OPTIONS = ['2x por semana', '3x por semana', '4x por semana', '5x por semana', '6x por semana', 'Todos os dias'];

const PONTOS_FRACOS_OPTIONS = [
  'Dorsal / Largura', 'Dorsal / Espessura', 'Peitoral superior', 'Peitoral geral',
  'Deltoide lateral', 'Deltoide posterior', 'Deltoide anterior', 'Trapézio',
  'Bíceps', 'Tríceps', 'Antebraço', 'Abdômen', 'Oblíquos',
  'Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilha'
];

const RESTRICOES_ARTICULARES_OPTIONS = [
  'Hérnia de disco (cervical/lombar)',
  'Condromalácia patelar',
  'Tendinite / Bursite de ombro',
  'Lesão de Labrum',
  'Manguito rotador',
  'Pinçamento de nervo ciático',
  'Instabilidade de tornozelo'
];

const CONDICOES_CARDIO_OPTIONS = [
  'Hipertensão (Pressão Alta)',
  'Hipotensão (Pressão Baixa)',
  'Diabetes (Tipo 1 ou 2)',
  'Labirintite',
  'Arritmia cardíaca'
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PublicStudentFichaPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [customRestricao, setCustomRestricao] = useState('');
  const [customCardio, setCustomCardio] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    whatsapp: '',
    instagram: '',
    photo_base64: '',
    data_nascimento: '',
    birth_date: '',
    age: '',
    height: '',
    current_weight: '',
    blood_type: '',
    goal: '',
    training_days: '',
    fase_shape: '',
    nivel_treino: '',
    frequencia_semanal: '',
    divisao_treino: '',
    objetivo_principal: '',
    objetivos_secundarios: '',
    pontos_fracos: [],
    lesoes_restricoes: '',
    restricoes_articulares: [],
    condicoes_cardio_metabolicas: [],
    cirurgias_reabilitacao: '',
    status_atestado: '',
    medicamentos_uso_continuo: '',
    dor_cronica_nivel: 0,
    dor_cronica_regiao: '',
    horas_sono_media: '',
    qualidade_sono_estresse: '',
    recursos_ergogenicos: '',
    contato_emergencia_nome: '',
    contato_emergencia_parentesco: '',
    contato_emergencia_telefone: '',

    // Initial Body Evaluation Measurements
    initial_evaluation: {
      peso: '',
      bf_percentual: '',
      pescoco: '',
      ombro: '',
      peitoral_torax: '',
      cintura: '',
      abdomen: '',
      quadril: '',
      braco_direito: '',
      braco_esquerdo: '',
      braco_contraido: '',
      coxa_direita: '',
      coxa_esquerda: '',
      panturrilha_direita: '',
      panturrilha_esquerda: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (token) {
      loadStudentFicha();
    }
  }, [token]);

  const loadStudentFicha = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`/api/public/ficha/${token}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setNotFound(true);
        return;
      }

      if (data.student) {
        if (data.student.is_expired) {
          setIsExpired(true);
          return;
        }
        const s = data.student;
        setFormData({
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          email: s.email || '',
          whatsapp: s.whatsapp || '',
          instagram: s.instagram || '',
          photo_base64: s.photo_base64 || '',
          data_nascimento: s.data_nascimento || s.birth_date || '',
          birth_date: s.birth_date || s.data_nascimento || '',
          age: s.age ? String(s.age) : '',
          height: s.height ? String(s.height) : '',
          current_weight: s.current_weight ? String(s.current_weight) : '',
          blood_type: s.blood_type || '',
          goal: s.goal || '',
          training_days: s.training_days || '',
          fase_shape: s.fase_shape || '',
          nivel_treino: s.nivel_treino || '',
          frequencia_semanal: s.frequencia_semanal || '',
          divisao_treino: s.divisao_treino || '',
          objetivo_principal: s.objetivo_principal || s.goal || '',
          objetivos_secundarios: s.objetivos_secundarios || '',
          pontos_fracos: Array.isArray(s.pontos_fracos) ? s.pontos_fracos : [],
          lesoes_restricoes: s.lesoes_restricoes || '',
          restricoes_articulares: Array.isArray(s.restricoes_articulares) ? s.restricoes_articulares : [],
          condicoes_cardio_metabolicas: Array.isArray(s.condicoes_cardio_metabolicas) ? s.condicoes_cardio_metabolicas : [],
          cirurgias_reabilitacao: s.cirurgias_reabilitacao || '',
          status_atestado: s.status_atestado || '',
          medicamentos_uso_continuo: s.medicamentos_uso_continuo || '',
          dor_cronica_nivel: s.dor_cronica_nivel || 0,
          dor_cronica_regiao: s.dor_cronica_regiao || '',
          horas_sono_media: s.horas_sono_media ? String(s.horas_sono_media) : '',
          qualidade_sono_estresse: s.qualidade_sono_estresse || '',
          recursos_ergogenicos: s.recursos_ergogenicos || '',
          contato_emergencia_nome: s.contato_emergencia_nome || '',
          contato_emergencia_parentesco: s.contato_emergencia_parentesco || '',
          contato_emergencia_telefone: s.contato_emergencia_telefone || '',
        });

        if (s.onboarding_completed) {
          setAlreadyCompleted(true);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar ficha:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file, 300, 300, 0.60);
        setFormData((prev) => ({ ...prev, photo_base64: compressedBase64 }));
      } catch (err) {
        console.error('Erro ao comprimir imagem:', err);
        alert('Erro ao processar imagem. Tente outra foto.');
      }
    }
  };

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? String(age) : '';
  };

  const handleBirthDateChange = (val) => {
    const ageCalc = calculateAge(val);
    setFormData((prev) => ({
      ...prev,
      data_nascimento: val,
      birth_date: val,
      age: ageCalc || prev.age,
    }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[field]) ? [...prev[field]] : [];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((i) => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const addCustomRestricao = () => {
    const trimmed = customRestricao.trim();
    if (!trimmed) return;
    if (!formData.restricoes_articulares.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, restricoes_articulares: [...prev.restricoes_articulares, trimmed] }));
    }
    setCustomRestricao('');
  };

  const addCustomCardio = () => {
    const trimmed = customCardio.trim();
    if (!trimmed) return;
    if (!formData.condicoes_cardio_metabolicas.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, condicoes_cardio_metabolicas: [...prev.condicoes_cardio_metabolicas, trimmed] }));
    }
    setCustomCardio('');
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(`/api/public/ficha/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao salvar ficha');
      }

      setCompleted(true);
    } catch (err) {
      console.error('Erro ao enviar ficha:', err);
      setErrorMsg(err.message || 'Erro ao salvar ficha. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="relative flex flex-col items-center gap-4">
          <img src="/loading.gif" alt="Carregando" className="w-16 h-16 object-contain" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando sua ficha de cadastro...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Link Temporário Expirado ⏳</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
          Por motivos de segurança e privacidade, os links para preenchimento de ficha possuem validade temporária de <strong className="text-slate-200">30 dias</strong>.
        </p>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-sm mb-6">
          Peça ao seu treinador ou à academia para gerar um novo link de preenchimento para você.
        </div>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-inner">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Ficha Concluída & Link Invalidado 🔒</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
          Sua ficha foi preenchida com sucesso e este link temporário foi <strong className="text-white">encerrado e invalidado</strong> para garantir a total privacidade dos seus dados.
        </p>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-sm mb-6 space-y-1">
          <p className="font-semibold text-slate-300">Precisa alterar alguma informação?</p>
          <p>Solicite a geração de um novo link ao seu personal trainer ou à academia.</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Ficha Não Encontrada</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Este link pode ter expirado ou ser inválido. Por favor, solicite um novo link ao seu personal trainer ou à academia.
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3">
          Ficha Enviada com Sucesso! 🚀
        </h1>
        <p className="text-slate-300 text-base max-w-md mb-6 leading-relaxed">
          Obrigado, <strong className="text-white">{formData.first_name}</strong>! Suas informações e preferências já foram enviadas com segurança para o seu treinador.
        </p>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 text-left space-y-3 mb-6 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span>Status da Ficha</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              Concluída & Ativa
            </span>
          </div>
          <div className="text-sm text-slate-300 space-y-1.5 pt-1">
            <p><span className="text-slate-500">Nome:</span> {formData.first_name} {formData.last_name}</p>
            {formData.objetivo_principal && <p><span className="text-slate-500">Objetivo:</span> {formData.objetivo_principal}</p>}
            {formData.current_weight && <p><span className="text-slate-500">Peso Inicial:</span> {formData.current_weight} kg</p>}
            {formData.height && <p><span className="text-slate-500">Altura:</span> {formData.height} cm</p>}
          </div>
        </div>

        <button
          onClick={() => setCompleted(false)}
          className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
        >
          Deseja fazer alguma alteração nos dados?
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-28">
      {/* Apple HIG Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3.5 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">Ficha do Aluno</h1>
              <p className="text-xs text-slate-400">Preencha seus dados para montagem do treino</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs text-blue-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Etapa {step} de 3
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="max-w-xl mx-auto mt-3 grid grid-cols-3 gap-1.5 px-0.5">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-slate-800'}`} />
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">

        {alreadyCompleted && !completed && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Você já preencheu esta ficha anteriormente.</p>
              <p className="text-amber-300/80 mt-0.5">Sinta-se à vontade para atualizar qualquer informação abaixo e clicar em salvar.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: DADOS PESSOAIS & FOTO */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Photo Avatar Section */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 text-center shadow-xl">
              <label className="inline-block relative cursor-pointer group">
                <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 group-hover:border-blue-500 flex items-center justify-center overflow-hidden transition-all shadow-inner">
                  {formData.photo_base64 ? (
                    <img src={formData.photo_base64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-950 group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-400 font-medium mt-3">Toque para adicionar sua foto de perfil</p>
            </div>

            {/* General Info Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
                <User className="w-4 h-4 text-blue-400" />
                Identificação Pessoal
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Seu primeiro nome"
                    value={formData.first_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sobrenome</label>
                  <input
                    type="text"
                    placeholder="Seu sobrenome"
                    value={formData.last_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Celular</label>
                  <PhoneInputWithContacts
                    value={formData.whatsapp}
                    onChange={(val) => setFormData((prev) => ({ ...prev, whatsapp: val }))}
                    onContactPick={({ firstName, lastName, phone }) => {
                      setFormData((prev) => ({
                        ...prev,
                        first_name: prev.first_name || firstName,
                        last_name: prev.last_name || lastName,
                        whatsapp: phone,
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Idade (anos)</label>
                  <input
                    type="number"
                    placeholder="Ex: 28"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Contato de Emergência
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome do Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={formData.contato_emergencia_nome}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contato_emergencia_nome: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parentesco</label>
                  <input
                    type="text"
                    placeholder="Mãe, Esposo, Irmão"
                    value={formData.contato_emergencia_parentesco}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contato_emergencia_parentesco: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telefone de Emergência</label>
                  <input
                    type="tel"
                    placeholder="(11) 98888-8888"
                    value={formData.contato_emergencia_telefone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contato_emergencia_telefone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEDIDAS FÍSICAS & TREINO */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Body Metrics Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
                <Scale className="w-4 h-4 text-emerald-400" />
                Medidas Físicas Iniciais
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Altura (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    value={formData.height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Peso Atual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={formData.current_weight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, current_weight: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo Sanguíneo</label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, blood_type: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Goals & Routine Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
                <Dumbbell className="w-4 h-4 text-purple-400" />
                Objetivos & Foco de Treino
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Objetivo Principal</label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJETIVO_OPTIONS.map((obj) => {
                    const isSelected = formData.objetivo_principal === obj || formData.goal === obj;
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, objetivo_principal: obj, goal: obj }))}
                        className={`p-3 rounded-2xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{obj}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nível de Treino</label>
                  <select
                    value={formData.nivel_treino}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nivel_treino: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    {NIVEL_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Frequência Semanal Desejada</label>
                  <select
                    value={formData.frequencia_semanal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, frequencia_semanal: e.target.value, training_days: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    {FREQUENCIA_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Pontos Fracos que Deseja Focar</label>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {PONTOS_FRACOS_OPTIONS.map((pf) => {
                    const isSelected = formData.pontos_fracos.includes(pf);
                    return (
                      <button
                        key={pf}
                        type="button"
                        onClick={() => toggleArrayItem('pontos_fracos', pf)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {pf} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fase do Shape Atual</label>
                  <select
                    value={formData.fase_shape}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fase_shape: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    {FASE_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Divisão de Treino Preferida</label>
                  <select
                    value={formData.divisao_treino}
                    onChange={(e) => setFormData((prev) => ({ ...prev, divisao_treino: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Selecione</option>
                    {DIVISAO_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Detailed Body Circumference Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Perímetros & Circunferências Corporais (Opcional)
                </div>
                <span className="text-[11px] text-slate-400">cm</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Peitoral / Tórax</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 100"
                    value={formData.initial_evaluation.peitoral_torax}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, peitoral_torax: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cintura</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 80"
                    value={formData.initial_evaluation.cintura}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, cintura: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Abdômen</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 85"
                    value={formData.initial_evaluation.abdomen}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, abdomen: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quadril / Glúteo</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 95"
                    value={formData.initial_evaluation.quadril}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, quadril: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Braço Contraído (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 38"
                    value={formData.initial_evaluation.braco_contraido}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, braco_contraido: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Coxa Direita</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex: 58"
                    value={formData.initial_evaluation.coxa_direita}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initial_evaluation: { ...prev.initial_evaluation, coxa_direita: e.target.value } }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SAÚDE, ANAMNESE & FINALIZAR */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Health & Joint Restraints */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
                <Heart className="w-4 h-4 text-rose-400" />
                Saúde, Lesões & Condições Médicas
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Lesões ou Restrições Articulares</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {RESTRICOES_ARTICULARES_OPTIONS.map((rest) => {
                    const isSelected = formData.restricoes_articulares.includes(rest);
                    return (
                      <button
                        key={rest}
                        type="button"
                        onClick={() => toggleArrayItem('restricoes_articulares', rest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-rose-500/25 border-rose-500 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {rest} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Outra lesão ou restrição..."
                    value={customRestricao}
                    onChange={(e) => setCustomRestricao(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomRestricao(); } }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomRestricao}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Condições Cardio / Metabólicas</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {CONDICOES_CARDIO_OPTIONS.map((c) => {
                    const isSelected = formData.condicoes_cardio_metabolicas.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleArrayItem('condicoes_cardio_metabolicas', c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-500 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {c} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Outra condição..."
                    value={customCardio}
                    onChange={(e) => setCustomCardio(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCardio(); } }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomCardio}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Chronic Pain Slider */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Nível de Dor Crônica / Desconforto</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    formData.dor_cronica_nivel == 0 ? 'bg-emerald-500/20 text-emerald-400' :
                    formData.dor_cronica_nivel <= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {formData.dor_cronica_nivel} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.dor_cronica_nivel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dor_cronica_nivel: parseInt(e.target.value, 10) }))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                {formData.dor_cronica_nivel > 0 && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Região da Dor / Desconforto</label>
                    <input
                      type="text"
                      placeholder="Ex: Lombar, Joelho direito"
                      value={formData.dor_cronica_regiao}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dor_cronica_regiao: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Medicamentos de Uso Contínuo</label>
                <textarea
                  rows={2}
                  placeholder="Informe caso utilize algum medicamento regularmente..."
                  value={formData.medicamentos_uso_continuo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medicamentos_uso_continuo: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observações ou Informações Importantes ao Treinador</label>
                <textarea
                  rows={3}
                  placeholder="Algum detalhe adicional sobre sua rotina, cirurgias antigas, horários ou preferências..."
                  value={formData.lesoes_restricoes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lesoes_restricoes: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Bottom Action Bar (Apple HIG Sheet Style) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-3 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!formData.first_name.trim()) {
                  setErrorMsg('Por favor, informe seu nome antes de avançar.');
                  return;
                }
                setErrorMsg('');
                setStep((s) => s + 1);
              }}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 ml-auto"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 ml-auto disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <img src="/loading.gif" alt="Enviando" className="w-4 h-4 object-contain" />
                  Enviando Ficha...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  Concluir Ficha
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

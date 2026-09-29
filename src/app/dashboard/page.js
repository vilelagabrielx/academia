'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Users, Dumbbell, FileText, Plus, MessageCircle, Instagram, ArrowUpRight, Search, Activity, 
  UserPlus, CheckCircle2, Eye, User, Scale, Droplet, Target, Calendar, CreditCard, Trash2, RefreshCw, AlertTriangle, AlertCircle, TrendingDown, DollarSign, Sparkles,
  Heart, Award, History, ArrowLeftRight, ShieldAlert, ChevronRight, ChevronLeft, Zap, Camera, Layers, TrendingUp
} from 'lucide-react';

const FASE_OPTIONS = ['Bulking', 'Cutting', 'Manutenção', 'Recomposição'];
const NIVEL_OPTIONS = ['Iniciante', 'Intermediário', 'Avançado / Atleta'];
const OBJETIVO_OPTIONS = ['Hipertrofia', 'Emagrecimento', 'Recomposição corporal', 'Ganho de força', 'Definição', 'Performance', 'Manutenção'];
const DIVISAO_OPTIONS = ['Full Body', 'Upper / Lower', 'Push / Pull / Legs', 'ABC', 'ABCD', 'ABCDE', 'Outro'];
const PONTOS_FRACOS_OPTIONS = [
  'Dorsal / Largura', 'Dorsal / Espessura', 'Peitoral superior', 'Peitoral geral',
  'Deltoide lateral', 'Deltoide posterior', 'Deltoide anterior', 'Trapézio',
  'Bíceps', 'Tríceps', 'Antebraço', 'Abdômen', 'Oblíquos',
  'Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilha', 'Outro'
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

export function parseHealthAlerts(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.filter((i) => i && typeof i === 'string' && i.trim() !== '' && i !== '[]' && i !== '{}');
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}' || trimmed === 'null' || trimmed === 'undefined') {
      return [];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((i) => i && typeof i === 'string' && i.trim() !== '' && i !== '[]' && i !== '{}');
        }
      } catch (e) {}
    }
    return [trimmed];
  }
  return [];
}

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

  // Student Profile Detail View Modal State & History
  const [viewingStudent, setViewingStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState({ evaluations: [], metas_history: [], prs: [], workout_logs: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo'); // 'resumo' | 'medidas' | 'desempenho' | 'historico'

  // New Evaluation Modal State
  const [showNewEvalModal, setShowNewEvalModal] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalSuccessToast, setEvalSuccessToast] = useState(null);
  const [evalFormData, setEvalFormData] = useState({
    data_registro: new Date().toISOString().split('T')[0],
    peso: '',
    bf_percentual: '',
    pescoco: '',
    ombro: '',
    peitoral_torax: '',
    dorsal_largura: '',
    dorsal_espessura: '',
    cintura: '',
    abdomen: '',
    quadril: '',
    braco_direito: '',
    braco_direito_contraido: '',
    braco_esquerdo: '',
    braco_esquerdo_contraido: '',
    braco_contraido: '',
    antebraco_direito: '',
    antebraco_esquerdo: '',
    coxa_direita: '',
    coxa_esquerda: '',
    gluteo: '',
    panturrilha_direita: '',
    panturrilha_esquerda: '',
    observacoes: ''
  });

  // Comparison Modal State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [compEvalIndex1, setCompEvalIndex1] = useState(1);
  const [compEvalIndex2, setCompEvalIndex2] = useState(0);

  // 3-Step Permanent Cascade Deletion Modal State
  const [hardDeleteModal, setHardDeleteModal] = useState(null);

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const getMeasurementStatus = (key, currentVal, prevVal, faseShape = 'Bulking') => {
    if (currentVal == null || prevVal == null || currentVal === '' || prevVal === '') return null;
    const curr = parseFloat(currentVal);
    const prev = parseFloat(prevVal);
    if (isNaN(curr) || isNaN(prev)) return null;

    const diff = curr - prev;
    const tolerance = 0.2;

    if (Math.abs(diff) <= tolerance) {
      return { status: 'estavel', label: 'Estável', color: 'text-slate-400', badgeBg: 'bg-slate-800 text-slate-300 border-slate-700', icon: '⚪', diffStr: '0' };
    }

    const isReductionMetric = ['cintura', 'abdomen', 'bf_percentual'].includes(key);

    if (key === 'peso') {
      if (faseShape === 'Bulking') {
        if (diff > 0) return { status: 'evolucao', label: 'Evolução', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🟢', diffStr: `+${diff.toFixed(1)}` };
        return { status: 'regressao', label: 'Regressão', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🔴', diffStr: `${diff.toFixed(1)}` };
      } else if (faseShape === 'Cutting') {
        if (diff < 0) return { status: 'evolucao', label: 'Evolução', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🟢', diffStr: `${diff.toFixed(1)}` };
        return { status: 'regressao', label: 'Regressão', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🔴', diffStr: `+${diff.toFixed(1)}` };
      } else {
        return { status: 'estavel', label: 'Estável', color: 'text-slate-400', badgeBg: 'bg-slate-800 text-slate-300 border-slate-700', icon: '⚪', diffStr: diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}` };
      }
    }

    if (isReductionMetric) {
      if (diff < 0) {
        return { status: 'evolucao', label: 'Evolução', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🟢', diffStr: `${diff.toFixed(1)}` };
      } else {
        return { status: 'regressao', label: 'Regressão', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🔴', diffStr: `+${diff.toFixed(1)}` };
      }
    } else {
      if (diff > 0) {
        return { status: 'evolucao', label: 'Evolução', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🟢', diffStr: `+${diff.toFixed(1)}` };
      } else {
        return { status: 'regressao', label: 'Regressão', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🔴', diffStr: `${diff.toFixed(1)}` };
      }
    }
  };

  const latestEval = studentHistory.evaluations[0] || null;
  const prevEval = studentHistory.evaluations[1] || null;

  const openStudentProfile = async (student) => {
    setViewingStudent(student);
    setActiveTab('resumo');
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/students/${student.id}/history`);
      if (res.ok) {
        const hData = await res.json();
        setStudentHistory({
          evaluations: hData.evaluations || [],
          metas_history: hData.metas_history || [],
          prs: hData.prs || [],
          workout_logs: hData.workout_logs || []
        });
      }
    } catch (err) {
      console.error('Error loading student history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Multi-step Registration Wizard Modal State (identico ao /dashboard/students)
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardMode, setWizardMode] = useState('fast'); // 'fast' | 'full'
  const [wizardStep, setWizardStep] = useState(1);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [showEvalAccordion, setShowEvalAccordion] = useState(false);
  const [customRestricaoInput, setCustomRestricaoInput] = useState('');
  const [customCardioInput, setCustomCardioInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    whatsapp: '',
    instagram: '',
    password: '',
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
    altura: '',
    observacoes_treinador: '',

    restricoes_articulares: [],
    condicoes_cardio_metabolicas: [],
    cirurgias_reabilitacao: '',
    status_atestado: '',
    atested_file_base64: '',
    medicamentos_uso_continuo: '',
    dor_cronica_nivel: '',
    dor_cronica_regiao: '',
    horas_sono_media: '',
    qualidade_sono_estresse: '',
    recursos_ergogenicos: '',
    contato_emergencia_nome: '',
    contato_emergencia_parentesco: '',
    contato_emergencia_telefone: '',

    prazo_meta: '',
    peso_meta: '',
    bf_meta: '',
    braco_meta: '',
    antebraco_meta: '',
    ombro_meta: '',
    peitoral_meta: '',
    cintura_meta: '',
    abdomen_meta: '',
    dorsal_meta: '',
    coxa_meta: '',
    gluteo_meta: '',
    panturrilha_meta: '',
    pescoco_meta: '',

    initial_evaluation: {
      data_registro: new Date().toISOString().split('T')[0],
      peso: '',
      bf_percentual: '',
      pescoco: '',
      ombro: '',
      peitoral_torax: '',
      dorsal_largura: '',
      dorsal_espessura: '',
      cintura: '',
      abdomen: '',
      quadril: '',
      braco_direito: '',
      braco_direito_contraido: '',
      braco_esquerdo: '',
      braco_esquerdo_contraido: '',
      braco_contraido: '',
      antebraco_direito: '',
      antebraco_esquerdo: '',
      coxa_direita: '',
      coxa_esquerda: '',
      gluteo: '',
      panturrilha_direita: '',
      panturrilha_esquerda: '',
      observacoes: ''
    },

    create_first_billing: false,
    billing_amount: '150.00',
    billing_due_date: new Date().toISOString().split('T')[0],
    dia_vencimento_recorrente: 5,
    billing_notes: 'Mensalidade',
    billing_payment_method: 'Pix',
    is_recurring: false,
    send_whatsapp_now: false,
  });

  const addCustomRestricao = () => {
    const trimmed = customRestricaoInput.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const currentArr = Array.isArray(prev.restricoes_articulares) ? [...prev.restricoes_articulares] : [];
      if (!currentArr.includes(trimmed)) {
        return { ...prev, restricoes_articulares: [...currentArr, trimmed] };
      }
      return prev;
    });
    setCustomRestricaoInput('');
  };

  const removeRestricaoTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      restricoes_articulares: (Array.isArray(prev.restricoes_articulares) ? prev.restricoes_articulares : []).filter((i) => i !== tagToRemove),
    }));
  };

  const addCustomCardio = () => {
    const trimmed = customCardioInput.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const currentArr = Array.isArray(prev.condicoes_cardio_metabolicas) ? [...prev.condicoes_cardio_metabolicas] : [];
      if (!currentArr.includes(trimmed)) {
        return { ...prev, condicoes_cardio_metabolicas: [...currentArr, trimmed] };
      }
      return prev;
    });
    setCustomCardioInput('');
  };

  const removeCardioTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      condicoes_cardio_metabolicas: (Array.isArray(prev.condicoes_cardio_metabolicas) ? prev.condicoes_cardio_metabolicas : []).filter((i) => i !== tagToRemove),
    }));
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

  const handleAtestadoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, atested_file_base64: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMeasurementKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      if (!form) return;
      const index = Array.prototype.indexOf.call(form, e.target);
      if (index >= 0 && index < form.elements.length - 1) {
        const next = form.elements[index + 1];
        if (next && typeof next.focus === 'function') {
          next.focus();
          if (typeof next.select === 'function') next.select();
        }
      }
    }
  };

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem('student_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.wizardStep) setWizardStep(parsed.wizardStep);
        if (parsed.wizardMode) setWizardMode(parsed.wizardMode);
        setHasDraft(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem('student_wizard_draft');
      setHasDraft(false);
    } catch (e) {}
  };

  const handleOpenCreateWizard = () => {
    setEditingStudentId(null);
    setWizardMode('fast');
    setWizardStep(1);
    setShowEvalAccordion(false);
    setErrorMsg('');

    let draftExists = false;
    try {
      const saved = localStorage.getItem('student_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && parsed.formData.first_name) draftExists = true;
      }
    } catch (e) {}
    setHasDraft(draftExists);

    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      whatsapp: '',
      instagram: '',
      password: '',
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
      altura: '',
      observacoes_treinador: '',

      restricoes_articulares: [],
      condicoes_cardio_metabolicas: [],
      cirurgias_reabilitacao: '',
      status_atestado: '',
      atested_file_base64: '',
      medicamentos_uso_continuo: '',
      dor_cronica_nivel: '',
      dor_cronica_regiao: '',
      horas_sono_media: '',
      qualidade_sono_estresse: '',
      recursos_ergogenicos: '',
      contato_emergencia_nome: '',
      contato_emergencia_parentesco: '',
      contato_emergencia_telefone: '',

      prazo_meta: '',
      peso_meta: '',
      bf_meta: '',
      braco_meta: '',
      antebraco_meta: '',
      ombro_meta: '',
      peitoral_meta: '',
      cintura_meta: '',
      abdomen_meta: '',
      dorsal_meta: '',
      coxa_meta: '',
      gluteo_meta: '',
      panturrilha_meta: '',
      pescoco_meta: '',

      initial_evaluation: {
        data_registro: new Date().toISOString().split('T')[0],
        peso: '',
        bf_percentual: '',
        pescoco: '',
        ombro: '',
        peitoral_torax: '',
        dorsal_largura: '',
        dorsal_espessura: '',
        cintura: '',
        abdomen: '',
        quadril: '',
        braco_direito: '',
        braco_direito_contraido: '',
        braco_esquerdo: '',
        braco_esquerdo_contraido: '',
        braco_contraido: '',
        antebraco_direito: '',
        antebraco_esquerdo: '',
        coxa_direita: '',
        coxa_esquerda: '',
        gluteo: '',
        panturrilha_direita: '',
        panturrilha_esquerda: '',
        observacoes: ''
      },

      create_first_billing: false,
      billing_amount: '150.00',
      billing_due_date: new Date().toISOString().split('T')[0],
      dia_vencimento_recorrente: 5,
      billing_notes: 'Mensalidade',
      billing_payment_method: 'Pix',
      is_recurring: false,
      send_whatsapp_now: false,
    });
    setShowWizardModal(true);
  };

  const handleOpenEditWizard = (student) => {
    setEditingStudentId(student.id);
    setWizardMode('full');
    setWizardStep(1);
    setShowEvalAccordion(false);
    setErrorMsg('');
    setHasDraft(false);

    let parsedPontosFracos = [];
    if (student.pontos_fracos) {
      try {
        parsedPontosFracos = typeof student.pontos_fracos === 'string' ? JSON.parse(student.pontos_fracos) : student.pontos_fracos;
      } catch {
        parsedPontosFracos = student.pontos_fracos ? String(student.pontos_fracos).split(',').map(s => s.trim()) : [];
      }
    }

    let parsedRestricoes = [];
    if (student.restricoes_articulares) {
      try {
        parsedRestricoes = typeof student.restricoes_articulares === 'string' ? JSON.parse(student.restricoes_articulares) : student.restricoes_articulares;
      } catch {
        parsedRestricoes = student.restricoes_articulares ? String(student.restricoes_articulares).split(',').map(s => s.trim()) : [];
      }
    }

    let parsedCardio = [];
    if (student.condicoes_cardio_metabolicas) {
      try {
        parsedCardio = typeof student.condicoes_cardio_metabolicas === 'string' ? JSON.parse(student.condicoes_cardio_metabolicas) : student.condicoes_cardio_metabolicas;
      } catch {
        parsedCardio = student.condicoes_cardio_metabolicas ? String(student.condicoes_cardio_metabolicas).split(',').map(s => s.trim()) : [];
      }
    }

    const bDateStr = student.birth_date || student.data_nascimento ? String(student.birth_date || student.data_nascimento).split('T')[0] : '';

    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      username: student.username || '',
      email: student.email || '',
      whatsapp: student.whatsapp || '',
      instagram: student.instagram || '',
      password: '',
      photo_base64: student.photo_base64 || '',
      data_nascimento: bDateStr,
      birth_date: bDateStr,
      age: student.age || (bDateStr ? String(calculateAge(bDateStr)) : ''),
      height: student.height || '175',
      current_weight: student.current_weight || '',
      blood_type: student.blood_type || 'O+',
      goal: student.goal || 'Hipertrofia',
      training_days: student.training_days || 'Segunda, Quarta, Sexta',

      fase_shape: student.fase_shape || 'Bulking',
      nivel_treino: student.nivel_treino || 'Intermediário',
      frequencia_semanal: student.frequencia_semanal || '5x por semana',
      divisao_treino: student.divisao_treino || 'Push / Pull / Legs',
      objetivo_principal: student.objetivo_principal || student.goal || 'Hipertrofia',
      objetivos_secundarios: student.objetivos_secundarios || '',
      pontos_fracos: parsedPontosFracos,
      altura: student.altura || student.height || '175',
      observacoes_treinador: student.observacoes_treinador || '',

      restricoes_articulares: parsedRestricoes,
      condicoes_cardio_metabolicas: parsedCardio,
      cirurgias_reabilitacao: student.cirurgias_reabilitacao || '',
      status_atestado: student.status_atestado || 'Pendente',
      atested_file_base64: student.atested_file_base64 || '',
      medicamentos_uso_continuo: student.medicamentos_uso_continuo || '',
      dor_cronica_nivel: student.dor_cronica_nivel || '',
      dor_cronica_regiao: student.dor_cronica_regiao || '',
      horas_sono_media: student.horas_sono_media || '',
      qualidade_sono_estresse: student.qualidade_sono_estresse || '',
      recursos_ergogenicos: student.recursos_ergogenicos || '',
      contato_emergencia_nome: student.contato_emergencia_nome || '',
      contato_emergencia_parentesco: student.contato_emergencia_parentesco || '',
      contato_emergencia_telefone: student.contato_emergencia_telefone || '',

      prazo_meta: student.prazo_meta || '90 dias (3 meses)',
      peso_meta: student.peso_meta || '',
      bf_meta: student.bf_meta || '',
      braco_meta: student.braco_meta || '',
      antebraco_meta: student.antebraco_meta || '',
      ombro_meta: student.ombro_meta || '',
      peitoral_meta: student.peitoral_meta || '',
      cintura_meta: student.cintura_meta || '',
      abdomen_meta: student.abdomen_meta || '',
      dorsal_meta: student.dorsal_meta || '',
      coxa_meta: student.coxa_meta || '',
      gluteo_meta: student.gluteo_meta || '',
      panturrilha_meta: student.panturrilha_meta || '',
      pescoco_meta: student.pescoco_meta || '',

      initial_evaluation: {
        data_registro: new Date().toISOString().split('T')[0],
        peso: '',
        bf_percentual: '',
        pescoco: '',
        ombro: '',
        peitoral_torax: '',
        dorsal_largura: '',
        dorsal_espessura: '',
        cintura: '',
        abdomen: '',
        quadril: '',
        braco_direito: '',
        braco_direito_contraido: '',
        braco_esquerdo: '',
        braco_esquerdo_contraido: '',
        braco_contraido: '',
        antebraco_direito: '',
        antebraco_esquerdo: '',
        coxa_direita: '',
        coxa_esquerda: '',
        gluteo: '',
        panturrilha_direita: '',
        panturrilha_esquerda: '',
        observacoes: ''
      },

      create_first_billing: false,
      billing_amount: '150.00',
      billing_due_date: new Date().toISOString().split('T')[0],
      dia_vencimento_recorrente: 5,
      billing_notes: 'Mensalidade',
      billing_payment_method: 'Pix',
      is_recurring: false,
      send_whatsapp_now: false,
    });
    setShowWizardModal(true);
  };

  const handleSubmitWizard = async (e) => {
    if (e) e.preventDefault();
    if (!formData.first_name && !editingStudentId) {
      return setErrorMsg('O Nome do aluno é o único campo obrigatório!');
    }

    if (formData.create_first_billing && !formData.whatsapp.trim()) {
      return setErrorMsg('Para gerar a primeira cobrança, o preenchimento do WhatsApp é OBRIGATÓRIO!');
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const cleanPhone = formData.whatsapp ? formData.whatsapp.replace(/\D/g, '') : '';
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

      clearDraft();
      setShowWizardModal(false);
      showToast(editingStudentId ? 'Ficha do aluno atualizada com sucesso!' : 'Aluno cadastrado com sucesso!', 'success');
      loadData();
      if (editingStudentId && viewingStudent?.id === editingStudentId) {
        openStudentProfile({ ...viewingStudent, ...payload });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const [stdRes, cfRes, bSummaryRes] = await Promise.all([
        fetch('/api/students'),
        fetch(`/api/cashflow?month_year=${currentMonthStr}`),
        fetch(`/api/billings?month_year=${currentMonthStr}`),
      ]);
      const stdData = await stdRes.json();
      const cfData = await cfRes.json();
      const bSummaryData = await bSummaryRes.json();

      setStudents(stdData.students || []);

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

  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    if (!viewingStudent) return;
    setEvalSubmitting(true);

    try {
      const res = await fetch(`/api/students/${viewingStudent.id}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar avaliação');

      const evalRes = data.result || {};
      const evalCount = studentHistory.evaluations.length;
      const toastText = evalCount === 0 
        ? '✅ Primeira avaliação registrada com sucesso!'
        : `✅ Avaliação registrada! (${evalRes.evolutions || 0} evoluções, ${evalRes.stables || 0} estáveis, ${evalRes.regressions || 0} regressões)`;

      setEvalSuccessToast(toastText);
      setTimeout(() => setEvalSuccessToast(null), 5000);

      setShowNewEvalModal(false);
      openStudentProfile(viewingStudent);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    setHardDeleteModal({
      id,
      name: name || 'Aluno',
      step: 1,
      textInput: '',
      submitting: false
    });
  };

  const executeHardDelete = async () => {
    if (!hardDeleteModal) return;
    setHardDeleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`/api/students/${hardDeleteModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir aluno em cascata');
      showToast('Aluno e todos os seus registros em cascata foram excluídos permanentemente!', 'success');
      setViewingStudent(null);
      setHardDeleteModal(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
      setHardDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
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
              onClick={handleOpenCreateWizard}
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
              onClick={handleOpenCreateWizard}
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
          <LoadingSpinner text="Carregando dados dos alunos..." size="lg" className="py-8" />
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
                    onClick={() => openStudentProfile(student)}
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
                        onClick={() => openStudentProfile(student)}
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
                        onClick={() => openStudentProfile(student)}
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
                            onClick={() => openStudentProfile(student)}
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

      {/* Toast Notification for Eval */}
      {evalSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl font-extrabold shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{evalSuccessToast}</span>
        </div>
      )}

      {/* MODAL STUDENT PROFILE DETAILS — FICHA DO ALUNO COMPLETA */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-4xl rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">Ficha do Aluno — Musculação & Evolução</h3>
                  <span className="text-xs text-slate-400">Acompanhamento completo de Shape, Metas, Saúde e Performance</span>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-all"
              >
                ✕
              </button>
            </div>

            {/* Student Header Card with Health Badges */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5 rounded-2xl border border-slate-800">
              {viewingStudent.photo_base64 ? (
                <img
                  src={viewingStudent.photo_base64}
                  alt={viewingStudent.username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-3xl shrink-0">
                  {viewingStudent.first_name?.[0] || viewingStudent.username[0]?.toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {viewingStudent.first_name} {viewingStudent.last_name}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">@{viewingStudent.username}</span>
                  {calculateAge(viewingStudent.birth_date || viewingStudent.data_nascimento) !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
                      🎉 {calculateAge(viewingStudent.birth_date || viewingStudent.data_nascimento)} anos
                    </span>
                  )}
                </div>

                {/* Badges Section */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {viewingStudent.fase_shape && (
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-extrabold text-[11px] shadow-sm">
                      [{viewingStudent.fase_shape}]
                    </span>
                  )}
                  {viewingStudent.nivel_treino && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-extrabold text-[11px]">
                      [{viewingStudent.nivel_treino}]
                    </span>
                  )}
                  {(viewingStudent.objetivo_principal || viewingStudent.goal) && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px]">
                      [{viewingStudent.objetivo_principal || viewingStudent.goal}]
                    </span>
                  )}
                  {viewingStudent.status_atestado && (
                    <span className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] border ${
                      viewingStudent.status_atestado === 'Liberado Total'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : viewingStudent.status_atestado === 'Liberado com Restrições'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                    }`}>
                      Atestado: {viewingStudent.status_atestado}
                    </span>
                  )}
                </div>

                {/* Health Alert Badges */}
                {(() => {
                  const modalRestricoes = parseHealthAlerts(viewingStudent.restricoes_articulares);
                  const modalCardio = parseHealthAlerts(viewingStudent.condicoes_cardio_metabolicas);
                  if (modalRestricoes.length === 0 && modalCardio.length === 0 && !viewingStudent.cirurgias_reabilitacao) return null;
                  return (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      {modalRestricoes.length > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-extrabold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                          Restrições: {modalRestricoes.join(', ')}
                        </span>
                      )}

                      {modalCardio.length > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-red-600/20 border border-red-500/50 text-red-300 font-extrabold text-[11px] flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          Cardio: {modalCardio.join(', ')}
                        </span>
                      )}

                      {viewingStudent.cirurgias_reabilitacao && (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-[11px]">
                          Cirurgia: {viewingStudent.cirurgias_reabilitacao}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Contato de Emergência Box - Destaque Principal */}
                {viewingStudent.contato_emergencia_nome && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200 mt-2 shadow-lg shadow-amber-500/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                      <div>
                        <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px] block">Contato de Emergência (Indispensável)</span>
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
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 text-xs shadow-md transition-all cursor-pointer"
                        title="Ligar ou enviar mensagem para contato de emergência"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{viewingStudent.contato_emergencia_telefone}</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {viewingStudent.whatsapp && (
                    <a
                      href={`https://wa.me/${viewingStudent.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{viewingStudent.whatsapp}</span>
                    </a>
                  )}

                  {viewingStudent.instagram && (
                    <a
                      href={viewingStudent.instagram.startsWith('http') ? viewingStudent.instagram : `https://instagram.com/${viewingStudent.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950 via-pink-950 to-amber-950 border border-pink-500/50 text-pink-200 hover:text-white hover:border-pink-400 transition-all text-xs font-bold shadow-lg shadow-pink-500/20 group"
                    >
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                        <Instagram className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold tracking-wide">
                        {viewingStudent.instagram.startsWith('@') ? viewingStudent.instagram : `@${viewingStudent.instagram}`}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('resumo')}
                className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'resumo'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                Resumo & Shape
              </button>
              <button
                onClick={() => setActiveTab('medidas')}
                className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'medidas'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-4 h-4" />
                Aferição Corporal
              </button>
              <button
                onClick={() => setActiveTab('desempenho')}
                className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'desempenho'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                Performance & PRs
              </button>
              <button
                onClick={() => setActiveTab('historico')}
                className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'historico'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                Timeline de Avaliações
              </button>
            </div>

            {/* TAB CONTENT 1: RESUMO & SHAPE */}
            {activeTab === 'resumo' && (
              <div className="space-y-6 text-xs">
                {/* Visual Indicators Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Peso Atual</span>
                    <span className="text-xl font-black text-white block mt-1">
                      {latestEval?.peso ? `${latestEval.peso} kg` : viewingStudent.current_weight ? `${viewingStudent.current_weight} kg` : '—'}
                    </span>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">% Gordura (BF)</span>
                    <span className="text-xl font-black text-cyan-400 block mt-1">
                      {latestEval?.bf_percentual ? `${latestEval.bf_percentual}%` : '—'}
                    </span>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Braço D. Contraído</span>
                    <span className="text-xl font-black text-purple-400 block mt-1">
                      {latestEval?.braco_direito_contraido || latestEval?.braco_contraido || latestEval?.braco_direito ? `${latestEval.braco_direito_contraido || latestEval.braco_contraido || latestEval.braco_direito} cm` : '—'}
                    </span>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cintura</span>
                    <span className="text-xl font-black text-emerald-400 block mt-1">
                      {latestEval?.cintura ? `${latestEval.cintura} cm` : '—'}
                    </span>
                  </div>
                </div>

                {/* Observações do Treinador */}
                {viewingStudent.observacoes_treinador && (
                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" /> Observações do Treinador:
                    </span>
                    <p className="text-xs text-slate-300 italic pl-5">{viewingStudent.observacoes_treinador}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: MEDIDAS CORPORAIS */}
            {activeTab === 'medidas' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Avaliação Corporal Detalhada
                  </h4>
                  <button
                    onClick={() => setShowNewEvalModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nova Avaliação</span>
                  </button>
                </div>

                {/* Bilateral Arms Contrast Callout */}
                {latestEval?.braco_direito_contraido && latestEval?.braco_esquerdo_contraido && Math.abs(parseFloat(latestEval.braco_direito_contraido) - parseFloat(latestEval.braco_esquerdo_contraido)) >= 0.5 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      ⚠️ Assimetria em Braço Contraído: Direito ({latestEval.braco_direito_contraido} cm) vs. Esquerdo ({latestEval.braco_esquerdo_contraido} cm) — Diferença de {Math.abs(parseFloat(latestEval.braco_direito_contraido) - parseFloat(latestEval.braco_esquerdo_contraido)).toFixed(1)} cm.
                    </span>
                  </div>
                )}

                {/* Complete Measurements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'braco_direito', label: 'Braço D. Relaxado', val: latestEval?.braco_direito, prev: prevEval?.braco_direito },
                    { key: 'braco_direito_contraido', label: 'Braço D. Contraído', val: latestEval?.braco_direito_contraido || latestEval?.braco_contraido, prev: prevEval?.braco_direito_contraido || prevEval?.braco_contraido },
                    { key: 'braco_esquerdo', label: 'Braço E. Relaxado', val: latestEval?.braco_esquerdo, prev: prevEval?.braco_esquerdo },
                    { key: 'braco_esquerdo_contraido', label: 'Braço E. Contraído', val: latestEval?.braco_esquerdo_contraido, prev: prevEval?.braco_esquerdo_contraido },
                    { key: 'antebraco_direito', label: 'Antebraço D', val: latestEval?.antebraco_direito, prev: prevEval?.antebraco_direito },
                    { key: 'antebraco_esquerdo', label: 'Antebraço E', val: latestEval?.antebraco_esquerdo, prev: prevEval?.antebraco_esquerdo },
                    { key: 'ombro', label: 'Ombros', val: latestEval?.ombro, prev: prevEval?.ombro },
                    { key: 'peitoral_torax', label: 'Peitoral / Tórax', val: latestEval?.peitoral_torax, prev: prevEval?.peitoral_torax },
                    { key: 'dorsal_largura', label: 'Dorsal Largura', val: latestEval?.dorsal_largura, prev: prevEval?.dorsal_largura },
                    { key: 'dorsal_espessura', label: 'Dorsal Espessura', val: latestEval?.dorsal_espessura, prev: prevEval?.dorsal_espessura },
                    { key: 'cintura', label: 'Cintura', val: latestEval?.cintura, prev: prevEval?.cintura },
                    { key: 'abdomen', label: 'Abdômen', val: latestEval?.abdomen, prev: prevEval?.abdomen },
                    { key: 'quadril', label: 'Quadril', val: latestEval?.quadril, prev: prevEval?.quadril },
                    { key: 'coxa_direita', label: 'Coxa Medial D', val: latestEval?.coxa_direita, prev: prevEval?.coxa_direita },
                    { key: 'coxa_esquerda', label: 'Coxa Medial E', val: latestEval?.coxa_esquerda, prev: prevEval?.coxa_esquerda },
                    { key: 'gluteo', label: 'Glúteo', val: latestEval?.gluteo, prev: prevEval?.gluteo },
                    { key: 'panturrilha_direita', label: 'Panturrilha D', val: latestEval?.panturrilha_direita, prev: prevEval?.panturrilha_direita },
                    { key: 'panturrilha_esquerda', label: 'Panturrilha E', val: latestEval?.panturrilha_esquerda, prev: prevEval?.panturrilha_esquerda },
                    { key: 'pescoco', label: 'Pescoço', val: latestEval?.pescoco, prev: prevEval?.pescoco },
                  ].map((m) => {
                    const st = getMeasurementStatus(m.key, m.val, m.prev, viewingStudent.fase_shape || 'Bulking');

                    return (
                      <div key={m.key} className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px]">{m.label}</span>
                          <span className="text-sm font-black text-white">{m.val ? `${m.val} cm` : '—'}</span>
                        </div>
                        {st && (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${st.badgeBg}`}>
                            {st.icon} {st.diffStr} cm
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PERFORMANCE */}
            {activeTab === 'desempenho' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    Recordes Pessoais & Evolução de Carga
                  </h4>
                </div>

                {studentHistory.prs.length === 0 ? (
                  <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                    <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>Nenhum log de treino registrado ainda para este aluno.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {studentHistory.prs.map((pr, idx) => (
                      <div key={idx} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#D4AF37]" />
                            {pr.exercise_name || `Exercício #${pr.exercise_id}`}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xl font-black text-emerald-400">{pr.max_weight} kg</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{pr.max_reps} reps</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: HISTÓRICO DE AVALIAÇÕES */}
            {activeTab === 'historico' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    Timeline de Avaliações Corporais
                  </h4>
                </div>

                {studentHistory.evaluations.length === 0 ? (
                  <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                    <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>Nenhuma avaliação registrada ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentHistory.evaluations.map((evalItem, index) => (
                      <div key={evalItem.id || index} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-extrabold text-white flex items-center gap-2">
                            📅 {new Date(evalItem.data_registro).toLocaleDateString('pt-BR')}
                            {index === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                                Última / Atual
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div><span className="text-slate-400 block text-[10px]">Peso:</span><span className="font-bold text-white">{evalItem.peso ? `${evalItem.peso} kg` : '—'}</span></div>
                          <div><span className="text-slate-400 block text-[10px]">BF:</span><span className="font-bold text-white">{evalItem.bf_percentual ? `${evalItem.bf_percentual}%` : '—'}</span></div>
                          <div><span className="text-slate-400 block text-[10px]">Braço D Contraído:</span><span className="font-bold text-white">{evalItem.braco_direito_contraido || evalItem.braco_contraido || evalItem.braco_direito ? `${evalItem.braco_direito_contraido || evalItem.braco_contraido || evalItem.braco_direito} cm` : '—'}</span></div>
                          <div><span className="text-slate-400 block text-[10px]">Cintura:</span><span className="font-bold text-white">{evalItem.cintura ? `${evalItem.cintura} cm` : '—'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-slate-800">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowNewEvalModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md cursor-pointer"
                >
                  + Nova Avaliação
                </button>
                <button
                  onClick={() => handleOpenEditWizard(viewingStudent)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                >
                  Editar Cadastro
                </button>
                <button
                  onClick={() => handleCancelEnrollment(viewingStudent.id, viewingStudent.first_name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer"
                  title="Desativar aluno e inativar a matrícula"
                >
                  Desativar Aluno
                </button>
                <button
                  onClick={() => handleDelete(viewingStudent.id, viewingStudent.first_name || viewingStudent.username)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 cursor-pointer"
                  title="Excluir aluno e todos os dados em cascata (requer 3 confirmações)"
                >
                  Apagar em Cascata
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA AFERIÇÃO / AVALIAÇÃO CORPORAL */}
      {showNewEvalModal && viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                Nova Aferição Corporal para {viewingStudent.first_name}
              </h3>
              <button onClick={() => setShowNewEvalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data da Avaliação *</label>
                  <input
                    type="date"
                    required
                    value={evalFormData.data_registro}
                    onChange={(e) => setEvalFormData({ ...evalFormData, data_registro: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={evalFormData.peso}
                    onChange={(e) => setEvalFormData({ ...evalFormData, peso: e.target.value })}
                    placeholder="75.5"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">% Gordura (BF)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={evalFormData.bf_percentual}
                    onChange={(e) => setEvalFormData({ ...evalFormData, bf_percentual: e.target.value })}
                    placeholder="13.0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tronco */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block">Tronco & Proporção</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><label className="block text-slate-400 mb-1">Pescoço (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.pescoco} onChange={(e) => setEvalFormData({ ...evalFormData, pescoco: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Ombros (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.ombro} onChange={(e) => setEvalFormData({ ...evalFormData, ombro: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Peitoral (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.peitoral_torax} onChange={(e) => setEvalFormData({ ...evalFormData, peitoral_torax: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Dorsal Largura (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.dorsal_largura} onChange={(e) => setEvalFormData({ ...evalFormData, dorsal_largura: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Dorsal Espessura (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.dorsal_espessura} onChange={(e) => setEvalFormData({ ...evalFormData, dorsal_espessura: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Cintura (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.cintura} onChange={(e) => setEvalFormData({ ...evalFormData, cintura: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Abdômen (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.abdomen} onChange={(e) => setEvalFormData({ ...evalFormData, abdomen: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Quadril (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.quadril} onChange={(e) => setEvalFormData({ ...evalFormData, quadril: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                </div>
              </div>

              {/* Membros Superiores */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-400 block">Braços & Antebraços</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><label className="block text-slate-400 mb-1">Braço D. Relaxado</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.braco_direito} onChange={(e) => setEvalFormData({ ...evalFormData, braco_direito: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-cyan-300 font-bold mb-1">Braço D. Contraído</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.braco_direito_contraido} onChange={(e) => setEvalFormData({ ...evalFormData, braco_direito_contraido: e.target.value, braco_contraido: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold" /></div>
                  <div><label className="block text-slate-400 mb-1">Braço E. Relaxado</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.braco_esquerdo} onChange={(e) => setEvalFormData({ ...evalFormData, braco_esquerdo: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-cyan-300 font-bold mb-1">Braço E. Contraído</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.braco_esquerdo_contraido} onChange={(e) => setEvalFormData({ ...evalFormData, braco_esquerdo_contraido: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold" /></div>
                </div>
              </div>

              {/* Membros Inferiores */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-purple-400 block">Pernas & Glúteos (Coxa Medial)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div><label className="block text-slate-400 mb-1">Coxa Medial D</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.coxa_direita} onChange={(e) => setEvalFormData({ ...evalFormData, coxa_direita: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Coxa Medial E</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.coxa_esquerda} onChange={(e) => setEvalFormData({ ...evalFormData, coxa_esquerda: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Glúteo (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.gluteo} onChange={(e) => setEvalFormData({ ...evalFormData, gluteo: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Panturrilha D (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.panturrilha_direita} onChange={(e) => setEvalFormData({ ...evalFormData, panturrilha_direita: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                  <div><label className="block text-slate-400 mb-1">Panturrilha E (cm)</label><input type="number" inputMode="decimal" step="0.1" value={evalFormData.panturrilha_esquerda} onChange={(e) => setEvalFormData({ ...evalFormData, panturrilha_esquerda: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" /></div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações da Avaliação</label>
                <input
                  type="text"
                  value={evalFormData.observacoes}
                  onChange={(e) => setEvalFormData({ ...evalFormData, observacoes: e.target.value })}
                  placeholder="Ex: Aluno em pumps pós treino..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewEvalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={evalSubmitting}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md"
                >
                  {evalSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3-STEP HARD CASCADE DELETE */}
      {hardDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-lg">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 border border-rose-500/40 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-black text-white">
                  Exclusão Definitiva em Cascata (Passo {hardDeleteModal.step}/3)
                </h3>
              </div>
              <button
                onClick={() => setHardDeleteModal(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Progress Stepper */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className={`h-2 flex-1 rounded-full transition-all ${hardDeleteModal.step >= 1 ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-slate-800'}`} />
              <div className={`h-2 flex-1 rounded-full transition-all ${hardDeleteModal.step >= 2 ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-slate-800'}`} />
              <div className={`h-2 flex-1 rounded-full transition-all ${hardDeleteModal.step >= 3 ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-slate-800'}`} />
            </div>

            {/* PASSO 1: ALERTA DE IMPACTO DE CASCATA */}
            {hardDeleteModal.step === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-2 text-rose-200">
                  <p className="font-extrabold text-white text-sm">
                    🚨 ATENÇÃO: Operação Destrutiva e Irreversível!
                  </p>
                  <p>
                    Você iniciou o processo para apagar o cadastro de <strong className="text-white font-bold">{hardDeleteModal.name}</strong>. Esta ação apagará <strong className="text-white font-bold">TODOS OS REGISTROS EM CASCATA</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    <li>Histórico completo de avaliações físicas e medidas corporais</li>
                    <li>Fichas de treino, registros de cargas e PRs (recordes)</li>
                    <li>Ficha de saúde, anamnese e atestados armazenados</li>
                    <li>Todas as cobranças e mensalidades vinculadas</li>
                    <li>Conta de acesso e perfil completo do usuário</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Recomendação:</strong> Se o aluno apenas cancelou a mensalidade ou trancou o plano, o ideal é usar a opção <strong>DESATIVAR ALUNO</strong> para preservar seu histórico.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const id = hardDeleteModal.id;
                      const name = hardDeleteModal.name;
                      setHardDeleteModal(null);
                      handleCancelEnrollment(id, name);
                    }}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    Preferencial: Apenas Desativar Aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => setHardDeleteModal((prev) => ({ ...prev, step: 2 }))}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Entendi os riscos ➔ Ir para Passo 2 (2/3)
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: DIGITAÇÃO DE CONFIRMAÇÃO */}
            {hardDeleteModal.step === 2 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Para liberar o botão de exclusão final em cascata, digite exatamente a palavra <strong className="text-rose-400 font-black tracking-wider uppercase">EXCLUIR</strong> no campo abaixo:
                </p>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    Confirmação de Segurança (2/3) *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={hardDeleteModal.textInput}
                    onChange={(e) => setHardDeleteModal((prev) => ({ ...prev, textInput: e.target.value }))}
                    placeholder="Digite EXCLUIR em maiúsculas"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl p-3 text-white font-bold placeholder-slate-600 focus:outline-none tracking-widest text-center text-sm"
                  />
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHardDeleteModal((prev) => ({ ...prev, step: 1 }))}
                    className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    ← Voltar ao Passo 1
                  </button>
                  <button
                    type="button"
                    disabled={hardDeleteModal.textInput.trim().toUpperCase() !== 'EXCLUIR'}
                    onClick={() => setHardDeleteModal((prev) => ({ ...prev, step: 3 }))}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Confirmar Digitação ➔ Passo 3 (3/3)
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: CONFIRMAÇÃO FINAL E DEFINITIVA */}
            {hardDeleteModal.step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-rose-600/20 border-2 border-rose-500 rounded-2xl text-rose-200 text-center space-y-2">
                  <p className="font-black text-rose-400 text-sm uppercase tracking-wide">
                    💣 CONFIRMAÇÃO FINAL DEFINITIVA (3/3)
                  </p>
                  <p className="text-white font-bold text-sm">
                    Esta é a sua ÚLTIMA CHANCE para cancelar!
                  </p>
                  <p className="text-slate-300">
                    Você tem certeza absoluta de que deseja apagar o aluno <strong className="text-white font-extrabold">{hardDeleteModal.name}</strong> e <strong className="text-rose-300">TODOS os seus dados vinculados em cascata</strong> do sistema?
                  </p>
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHardDeleteModal(null)}
                    className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar Operação
                  </button>
                  <button
                    type="button"
                    disabled={hardDeleteModal.submitting}
                    onClick={executeHardDelete}
                    className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-500 shadow-xl shadow-rose-600/40 disabled:opacity-50 cursor-pointer animate-pulse"
                  >
                    {hardDeleteModal.submitting ? 'EXCLUINDO EM CASCATA...' : '💥 SIM, EXCLUIR EM CASCATA DEFINITIVAMENTE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE ALUNO (WIZARD COMPLETO APPLE iOS STYLE) */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xl transition-all">
          <div className="glass-panel w-full max-w-3xl rounded-t-[32px] sm:rounded-3xl border border-white/10 shadow-2xl space-y-0 max-h-[94vh] overflow-y-auto flex flex-col justify-between">
            {/* Top Modal Header (iOS Sheet Header Style) */}
            <div className="p-5 sm:p-6 border-b border-white/10 space-y-4 sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    {editingStudentId ? 'Editar Ficha do Aluno' : 'Cadastrar Aluno'}
                  </h3>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                    Atalho: <kbd className="px-1.5 py-0.5 bg-slate-800/80 rounded-md border border-slate-700 text-emerald-400 font-bold font-mono">Ctrl + S</kbd> para salvar instantaneamente
                  </span>
                </div>
                <button 
                  onClick={() => setShowWizardModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Draft Restore Notification if Draft Exists */}
              {hasDraft && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shadow-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    Rascunho de cadastro salvo encontrado.
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={restoreDraft} className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all text-xs cursor-pointer">
                      Restaurar
                    </button>
                    <button type="button" onClick={clearDraft} className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all text-xs cursor-pointer">
                      Descartar
                    </button>
                  </div>
                </div>
              )}

              {/* iOS Segmented Control Selector Header (Balcão Rápido vs Ficha Completa) */}
              {!editingStudentId && (
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setWizardMode('fast')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px] ${
                      wizardMode === 'fast'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>⚡ Modo Rápido (15s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardMode('full')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px] ${
                      wizardMode === 'full'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>📋 Ficha Completa (5 Steps)</span>
                  </button>
                </div>
              )}

              {/* Steps Indicator Bar (Full Wizard Mode - iOS Segmented Tabs) */}
              {wizardMode === 'full' && (
                <div className="grid grid-cols-5 gap-1 text-center">
                  {['1. Perfil', '2. Saúde', '3. Aferição', '4. Metas', '5. Cobrança'].map((label, index) => {
                    const stepNum = index + 1;
                    return (
                      <button
                        key={stepNum}
                        onClick={() => setWizardStep(stepNum)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer min-h-[36px] ${
                          wizardStep === stepNum
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-900/80 text-slate-500 border border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 flex-1 space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shadow-sm font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form id="wizardForm" onSubmit={handleSubmitWizard} className="space-y-4 text-xs">
                {/* MODE 1: BALCÃO / RÁPIDO (15s) */}
                {wizardMode === 'fast' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Modo Balcão — Matrícula Rápida (15 Segundos)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Cadastre o aluno instantaneamente na recepção. O link para preenchimento da ficha técnica pode ser enviado via WhatsApp ao concluir!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Nome * (Obrigatório)</label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          placeholder="Ex: Gabriel"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Sobrenome</label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          placeholder="Vilela"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                          <span>WhatsApp (DDD + N°)</span>
                          {formData.create_first_billing && <span className="text-[9px] text-amber-400 font-extrabold">* Obr. p/ Cobrança</span>}
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="5511999999999"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Instagram (Opcional)</label>
                        <input
                          type="text"
                          value={formData.instagram || ''}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          placeholder="@usuario"
                          className="w-full bg-slate-900 border border-pink-500/30 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Quick Billing Checkbox */}
                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.create_first_billing}
                          onChange={(e) => setFormData({ ...formData, create_first_billing: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-white block text-xs">Criar 1ª cobrança de mensalidade agora</span>
                          <span className="text-[10px] text-slate-400 block">Gerar mensalidade automática com vencimento inicial.</span>
                        </div>
                      </label>

                      {formData.create_first_billing && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 text-xs">Valor (R$) *</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={formData.billing_amount}
                              onChange={(e) => setFormData({ ...formData, billing_amount: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 text-xs">1º Vencimento *</label>
                            <input
                              type="date"
                              value={formData.billing_due_date}
                              onChange={(e) => setFormData({ ...formData, billing_due_date: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 2: WIZARD FULL (5 ETAPAS) */}
                {wizardMode === 'full' && (
                  <>
                    {/* PASSO 1: DADOS DE PERFIL */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Nome * (Obrigatório)</label>
                            <input
                              type="text"
                              required
                              value={formData.first_name}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                              placeholder="Ex: Gabriel"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Sobrenome</label>
                            <input
                              type="text"
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                              placeholder="Vilela"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                              <span>WhatsApp (DDD + N°)</span>
                              {formData.create_first_billing && (
                                <span className="text-[9px] text-amber-400 font-extrabold">* Obr. p/ Cobrança</span>
                              )}
                            </label>
                            <input
                              type="tel"
                              inputMode="tel"
                              value={formData.whatsapp}
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              placeholder="5511999999999"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-pink-400 font-bold">
                                <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                Instagram
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">(Opcional • Destaque)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.instagram || ''}
                              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                              placeholder="@usuario ou link"
                              className="w-full bg-slate-900 border border-pink-500/30 focus:border-pink-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                              <span>Data de Nascimento</span>
                              {formData.data_nascimento && calculateAge(formData.data_nascimento) !== null && (
                                <span className="text-[10px] text-emerald-400 font-bold">
                                  🎉 {calculateAge(formData.data_nascimento)} anos
                                </span>
                              )}
                            </label>
                            <input
                              type="date"
                              value={formData.data_nascimento || ''}
                              onChange={(e) => {
                                const dStr = e.target.value;
                                const computed = calculateAge(dStr);
                                setFormData({
                                  ...formData,
                                  data_nascimento: dStr,
                                  birth_date: dStr,
                                  age: computed !== null ? String(computed) : formData.age
                                });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Altura (cm)</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={formData.altura || formData.height}
                              onChange={(e) => setFormData({ ...formData, altura: e.target.value, height: e.target.value })}
                              placeholder="182"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                              <span>Peso Inicial (kg)</span>
                              <span className="text-[9px] text-emerald-400 font-mono">⚡ Sync</span>
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              value={formData.current_weight}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData({
                                  ...formData,
                                  current_weight: val,
                                  initial_evaluation: { ...formData.initial_evaluation, peso: val }
                                });
                              }}
                              placeholder="84.5"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 font-bold text-emerald-400"
                            />
                          </div>
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
                          <div className="flex flex-wrap gap-2">
                            <label className="block text-xs font-semibold text-slate-300 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl border border-slate-700">
                              📷 Tirar Foto Agora
                              <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            <label className="block text-xs font-semibold text-slate-300 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl border border-slate-700">
                              🖼️ Da Galeria
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASSO 2: SAÚDE CLÍNICA, SEGURANÇA E CONTEXTO DE TREINO */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        {/* 1. Alertas Críticos (Badges em Destaque) */}
                        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>1. Alertas Críticos & Segurança (Badges em Destaque)</span>
                          </div>

                          {/* Restrições Articulares */}
                          <div>
                            <label className="block font-bold text-amber-300 mb-1 text-[11px]">
                              Restrições Articulares & Coluna (Tag Vermelha/Laranja no Perfil)
                            </label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                              {Array.from(new Set([...RESTRICOES_ARTICULARES_OPTIONS, ...(Array.isArray(formData.restricoes_articulares) ? formData.restricoes_articulares : [])])).map((item) => {
                                const isSelected = Array.isArray(formData.restricoes_articulares) && formData.restricoes_articulares.includes(item);
                                const isCustom = !RESTRICOES_ARTICULARES_OPTIONS.includes(item);
                                return (
                                  <button
                                    type="button"
                                    key={item}
                                    onClick={() => {
                                      if (isSelected) {
                                        removeRestricaoTag(item);
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev,
                                          restricoes_articulares: [...(Array.isArray(prev.restricoes_articulares) ? prev.restricoes_articulares : []), item]
                                        }));
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                      isSelected
                                        ? isCustom
                                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105 font-extrabold'
                                          : 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20 scale-105'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                    }`}
                                  >
                                    <span>{isSelected ? '✓ ' : '+ '} {item}</span>
                                    {isSelected && (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeRestricaoTag(item);
                                        }}
                                        className="ml-1 text-[11px] hover:text-white font-extrabold opacity-80 hover:opacity-100 px-1"
                                        title="Remover tag"
                                      >
                                        ✕
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Inline custom tag adder */}
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={customRestricaoInput}
                                onChange={(e) => setCustomRestricaoInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomRestricao();
                                  }
                                }}
                                placeholder="Outra restrição articular/coluna (ex: Prótese de quadril, Escoliose)..."
                                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none flex-1"
                              />
                              <button
                                type="button"
                                onClick={addCustomRestricao}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Tag</span>
                              </button>
                            </div>
                          </div>

                          {/* Condições Cardiovasculares & Metabólicas */}
                          <div>
                            <label className="block font-bold text-rose-400 mb-1 text-[11px]">
                              Condições Cardiovasculares & Metabólicas (Alerta de Risco Alto)
                            </label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                              {Array.from(new Set([...CONDICOES_CARDIO_OPTIONS, ...(Array.isArray(formData.condicoes_cardio_metabolicas) ? formData.condicoes_cardio_metabolicas : [])])).map((item) => {
                                const isSelected = Array.isArray(formData.condicoes_cardio_metabolicas) && formData.condicoes_cardio_metabolicas.includes(item);
                                const isCustom = !CONDICOES_CARDIO_OPTIONS.includes(item);
                                return (
                                  <button
                                    type="button"
                                    key={item}
                                    onClick={() => {
                                      if (isSelected) {
                                        removeCardioTag(item);
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev,
                                          condicoes_cardio_metabolicas: [...(Array.isArray(prev.condicoes_cardio_metabolicas) ? prev.condicoes_cardio_metabolicas : []), item]
                                        }));
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                      isSelected
                                        ? isCustom
                                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30 scale-105 font-extrabold'
                                          : 'bg-red-600 text-white border-red-400 shadow-md shadow-red-500/30 scale-105'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                    }`}
                                  >
                                    <span>{isSelected ? '✓ ' : '+ '} {item}</span>
                                    {isSelected && (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeCardioTag(item);
                                        }}
                                        className="ml-1 text-[11px] hover:text-white font-extrabold opacity-80 hover:opacity-100 px-1"
                                        title="Remover tag"
                                      >
                                        ✕
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Inline custom tag adder */}
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={customCardioInput}
                                onChange={(e) => setCustomCardioInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomCardio();
                                  }
                                }}
                                placeholder="Outra condição cardiovascular/metabólica (ex: Asma grave, Marcapasso)..."
                                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none flex-1"
                              />
                              <button
                                type="button"
                                onClick={addCustomCardio}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Tag</span>
                              </button>
                            </div>
                          </div>

                          {/* Cirurgias Recentes & Atestado Médico */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block font-semibold text-purple-300 mb-1">Cirurgias Recentes / Pós-Reabilitação</label>
                              <input
                                type="text"
                                value={formData.cirurgias_reabilitacao}
                                onChange={(e) => setFormData({ ...formData, cirurgias_reabilitacao: e.target.value })}
                                placeholder="Ex: LCA joelho esquerdo (6 meses), Cesárea..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Atestado Médico / Liberação</label>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                  { val: 'Liberado Total', label: '🟢 Liberado Total', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                                  { val: 'Liberado com Restrições', label: '🟡 c/ Restrições', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                                  { val: 'Pendente', label: '🔴 Pendente', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
                                ].map((opt) => (
                                  <button
                                    type="button"
                                    key={opt.val}
                                    onClick={() => setFormData({ ...formData, status_atestado: opt.val })}
                                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                                      formData.status_atestado === opt.val
                                        ? `${opt.bg} shadow-md scale-105`
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-bold text-[10px]">
                                  {formData.atested_file_base64 ? '✓ Anexado' : 'Upload'}
                                  <input type="file" accept="image/*,.pdf" onChange={handleAtestadoUpload} className="hidden" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Informações Úteis para Montagem de Treino */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                          <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>2. Contexto Fisiológico & Prescrição Técnica</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Medicamentos de Uso Contínuo</label>
                              <input
                                type="text"
                                value={formData.medicamentos_uso_continuo}
                                onChange={(e) => setFormData({ ...formData, medicamentos_uso_continuo: e.target.value })}
                                placeholder="Ex: Betabloqueadores, Estatinas..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Recursos Ergogênicos / Terapias</label>
                              <input
                                type="text"
                                value={formData.recursos_ergogenicos}
                                onChange={(e) => setFormData({ ...formData, recursos_ergogenicos: e.target.value })}
                                placeholder="Ex: TRT, Estimulantes pré-treino..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Dor Crônica (EVA 0-10)</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min="0" max="10"
                                value={formData.dor_cronica_nivel}
                                onChange={(e) => setFormData({ ...formData, dor_cronica_nivel: e.target.value })}
                                placeholder="0"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Região da Dor</label>
                              <input
                                type="text"
                                value={formData.dor_cronica_regiao}
                                onChange={(e) => setFormData({ ...formData, dor_cronica_regiao: e.target.value })}
                                placeholder="Ex: Lombar, Ombro D"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Média Sono (hs/noite)</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={formData.horas_sono_media}
                                onChange={(e) => setFormData({ ...formData, horas_sono_media: e.target.value })}
                                placeholder="Ex: 7.5h"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Nível Estresse (1-5)</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min="1" max="5"
                                value={formData.qualidade_sono_estresse}
                                onChange={(e) => setFormData({ ...formData, qualidade_sono_estresse: e.target.value })}
                                placeholder="1 a 5"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Contato de Emergência (Indispensável) */}
                        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3 shadow-md shadow-amber-500/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                              <Heart className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                              <span>3. Contato de Emergência (Indispensável)</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              ⚡ Destaque no Perfil & Tabela
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-bold text-amber-200 mb-1 text-xs">Nome do Contato</label>
                              <input
                                type="text"
                                value={formData.contato_emergencia_nome}
                                onChange={(e) => setFormData({ ...formData, contato_emergencia_nome: e.target.value })}
                                placeholder="Ex: Maria Vilela"
                                className="w-full bg-slate-900 border border-amber-500/30 focus:border-amber-400 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-amber-200 mb-1 text-xs">Parentesco</label>
                              <input
                                type="text"
                                value={formData.contato_emergencia_parentesco}
                                onChange={(e) => setFormData({ ...formData, contato_emergencia_parentesco: e.target.value })}
                                placeholder="Ex: Mãe, Esposa"
                                className="w-full bg-slate-900 border border-amber-500/30 focus:border-amber-400 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-amber-200 mb-1 text-xs">Telefone / WhatsApp</label>
                              <input
                                type="tel"
                                inputMode="tel"
                                value={formData.contato_emergencia_telefone}
                                onChange={(e) => setFormData({ ...formData, contato_emergencia_telefone: e.target.value })}
                                placeholder="(11) 99999-9999"
                                className="w-full bg-slate-900 border border-amber-500/30 focus:border-amber-400 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Periodização & Metodologia de Treino (Pills Selectors) */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                            <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>4. Periodização & Metodologia de Treino</span>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Fase do Shape</label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {FASE_OPTIONS.map((f) => (
                                <button
                                  type="button"
                                  key={f}
                                  onClick={() => setFormData({ ...formData, fase_shape: f })}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    formData.fase_shape === f
                                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-105'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Nível de Treino</label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {NIVEL_OPTIONS.map((n) => (
                                <button
                                  type="button"
                                  key={n}
                                  onClick={() => setFormData({ ...formData, nivel_treino: n })}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    formData.nivel_treino === n
                                      ? 'bg-purple-500 text-white border-purple-400 shadow-md scale-105'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Objetivo Principal</label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {OBJETIVO_OPTIONS.map((o) => (
                                <button
                                  type="button"
                                  key={o}
                                  onClick={() => setFormData({ ...formData, objetivo_principal: o, goal: o })}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    formData.objetivo_principal === o
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Frequência Semanal</label>
                            <input
                              type="text"
                              value={formData.frequencia_semanal}
                              onChange={(e) => setFormData({ ...formData, frequencia_semanal: e.target.value, training_days: e.target.value })}
                              placeholder="Ex: 5x por semana"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Pontos Fracos do Shape (Multi-seleção)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                              {PONTOS_FRACOS_OPTIONS.map((pf) => {
                                const isSelected = Array.isArray(formData.pontos_fracos) && formData.pontos_fracos.includes(pf);
                                return (
                                  <label key={pf} className={`flex items-center gap-1.5 text-[11px] p-1.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentArr = Array.isArray(formData.pontos_fracos) ? [...formData.pontos_fracos] : [];
                                        if (e.target.checked) {
                                          setFormData({ ...formData, pontos_fracos: [...currentArr, pf] });
                                        } else {
                                          setFormData({ ...formData, pontos_fracos: currentArr.filter((item) => item !== pf) });
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-950 border-slate-700"
                                    />
                                    <span>{pf}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASSO 3: AFERIÇÃO CORPORAL INICIAL (OPCIONAL & RECOLHIDO POR PADRÃO) */}
                    {wizardStep === 3 && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span>Avaliação Física Inicial (Fita Métrica)</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Deseja realizar a avaliação física completa agora? Atalho: Pressione Enter nos campos para navegar automaticamente!
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowEvalAccordion(!showEvalAccordion)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                              showEvalAccordion
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                                : 'bg-slate-800 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/40'
                            }`}
                          >
                            <span>{showEvalAccordion ? '▲ Recolher Avaliação' : '▼ Preencher Avaliação Agora'}</span>
                          </button>
                        </div>

                        {/* Sincronização de Peso com Etapa 1 */}
                        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-300 font-semibold">Peso Inicial do Perfil:</span>
                            <span className="text-sm font-black text-emerald-400">{formData.current_weight ? `${formData.current_weight} kg` : 'Não informado'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">⚡ Sincronizado automaticamente</span>
                        </div>

                        {!showEvalAccordion ? (
                          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 text-center space-y-2">
                            <Scale className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-300 font-bold">Avaliação física recolhida por padrão.</p>
                            <p className="text-[10px] text-slate-500">
                              Clique no botão acima para expandir os campos da fita métrica ou realize a avaliação a qualquer momento na ficha do aluno.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-800">
                            {/* Split Screen Anatomical Body Diagram on Desktop */}
                            <div className="hidden md:block md:col-span-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3 shrink-0">
                              <span className="text-xs font-bold text-cyan-400 block uppercase tracking-wider">Silhueta Anatômica</span>
                              <div className="w-full h-56 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center p-4 text-slate-600 space-y-2">
                                <User className="w-24 h-24 text-cyan-500/40 animate-pulse" />
                                <span className="text-[10px] text-cyan-300/80 font-mono font-bold uppercase">Painel de Referência Padrão ISAK</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic">
                                Tecla Enter pula automaticamente para a próxima medida.
                              </p>
                            </div>

                            {/* Measurement Input Fields Column */}
                            <div className="md:col-span-8 space-y-4">
                              {/* Datas & Dados Principais */}
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block font-semibold text-slate-300 mb-1">Data da Avaliação *</label>
                                  <input
                                    type="date"
                                    value={formData.initial_evaluation?.data_registro || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      initial_evaluation: { ...formData.initial_evaluation, data_registro: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-slate-300 mb-1">Peso (kg)</label>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    onKeyDown={handleMeasurementKeyDown}
                                    placeholder="84.5"
                                    value={formData.initial_evaluation?.peso || formData.current_weight || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData({
                                        ...formData,
                                        current_weight: val,
                                        initial_evaluation: { ...formData.initial_evaluation, peso: val }
                                      });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 font-bold text-emerald-400 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-slate-300 mb-1">BF (% Gordura)</label>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    onKeyDown={handleMeasurementKeyDown}
                                    placeholder="13.0"
                                    value={formData.initial_evaluation?.bf_percentual || ''}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      initial_evaluation: { ...formData.initial_evaluation, bf_percentual: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 text-xs"
                                  />
                                </div>
                              </div>

                              {/* Tronco & Proporção */}
                              <div className="space-y-2 pt-2 border-t border-slate-800">
                                <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                                  Tronco & Proporção
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Pescoço (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="40.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.pescoco || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, pescoco: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Ombros (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="125.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.ombro || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, ombro: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Peitoral (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="110.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.peitoral_torax || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, peitoral_torax: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Dorsal Largura (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="118.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.dorsal_largura || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, dorsal_largura: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Dorsal Espessura (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="42.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.dorsal_espessura || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, dorsal_espessura: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Cintura (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="82.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.cintura || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, cintura: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Abdômen (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="85.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.abdomen || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, abdomen: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Quadril (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="100.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.quadril || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, quadril: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Braços & Antebraços */}
                              <div className="space-y-2 pt-2 border-t border-slate-800">
                                <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                  Braços & Antebraços (Relaxados vs. Contraídos)
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Braço D. Relaxado (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="38.5" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.braco_direito || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, braco_direito: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-cyan-400 font-bold mb-1">Braço D. Contraído (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="41.5" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.braco_direito_contraido || formData.initial_evaluation?.braco_contraido || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, braco_direito_contraido: e.target.value, braco_contraido: e.target.value } })}
                                      className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 text-white font-bold text-cyan-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Braço E. Relaxado (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="38.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.braco_esquerdo || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, braco_esquerdo: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-cyan-400 font-bold mb-1">Braço E. Contraído (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="41.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.braco_esquerdo_contraido || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, braco_esquerdo_contraido: e.target.value } })}
                                      className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 text-white font-bold text-cyan-300"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Antebraço D (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="32.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.antebraco_direito || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, antebraco_direito: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Antebraço E (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="32.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.antebraco_esquerdo || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, antebraco_esquerdo: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Pernas & Glúteos */}
                              <div className="space-y-2 pt-2 border-t border-slate-800">
                                <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                                  Pernas & Glúteos (Coxa Medial / Padrão ISAK)
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Coxa Medial D (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="60.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.coxa_direita || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, coxa_direita: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Coxa Medial E (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="60.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.coxa_esquerda || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, coxa_esquerda: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Glúteo (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="102.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.gluteo || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, gluteo: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Panturrilha D (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="39.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.panturrilha_direita || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, panturrilha_direita: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Panturrilha E (cm)</label>
                                    <input
                                      type="number" inputMode="decimal" step="0.1" placeholder="39.0" onKeyDown={handleMeasurementKeyDown}
                                      value={formData.initial_evaluation?.panturrilha_esquerda || ''}
                                      onChange={(e) => setFormData({ ...formData, initial_evaluation: { ...formData.initial_evaluation, panturrilha_esquerda: e.target.value } })}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PASSO 4: METAS CORPORAIS & CONTEXTO TEMPORAL */}
                    {wizardStep === 4 && (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                          <label className="block font-bold text-emerald-400 text-xs uppercase tracking-wide">
                            ⏱️ Prazo / Data Alvo da Meta (Contexto Temporal)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['30 dias (1 mês)', '60 dias (2 meses)', '90 dias (3 meses)', '180 dias (6 meses)', '1 ano (12 meses)'].map((p) => (
                              <button
                                type="button"
                                key={p}
                                onClick={() => setFormData({ ...formData, prazo_meta: p })}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  formData.prazo_meta === p
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Peso Meta (kg)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.peso_meta} onChange={(e) => setFormData({ ...formData, peso_meta: e.target.value })} placeholder="90.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">BF Meta (%)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.bf_meta} onChange={(e) => setFormData({ ...formData, bf_meta: e.target.value })} placeholder="10.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Braço Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.braco_meta} onChange={(e) => setFormData({ ...formData, braco_meta: e.target.value })} placeholder="43.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Ombro Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.ombro_meta} onChange={(e) => setFormData({ ...formData, ombro_meta: e.target.value })} placeholder="130.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Peitoral Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.peitoral_meta} onChange={(e) => setFormData({ ...formData, peitoral_meta: e.target.value })} placeholder="115.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Cintura Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.cintura_meta} onChange={(e) => setFormData({ ...formData, cintura_meta: e.target.value })} placeholder="80.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Coxa Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.coxa_meta} onChange={(e) => setFormData({ ...formData, coxa_meta: e.target.value })} placeholder="65.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Glúteo Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.gluteo_meta} onChange={(e) => setFormData({ ...formData, gluteo_meta: e.target.value })} placeholder="105.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Panturrilha Meta (cm)</label>
                            <input type="number" inputMode="decimal" step="0.1" value={formData.panturrilha_meta} onChange={(e) => setFormData({ ...formData, panturrilha_meta: e.target.value })} placeholder="42.0" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Observações do Treinador</label>
                          <textarea
                            rows="2"
                            value={formData.observacoes_treinador}
                            onChange={(e) => setFormData({ ...formData, observacoes_treinador: e.target.value })}
                            placeholder="Observações técnicas, estilo de treino ou foco específico."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* PASSO 5: PRIMEIRA COBRANÇA (OPCIONAL) */}
                    {wizardStep === 5 && (
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all">
                          <input
                            type="checkbox"
                            checked={formData.create_first_billing}
                            onChange={(e) => setFormData({ ...formData, create_first_billing: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-white block text-xs">☐ Criar primeira cobrança para este aluno</span>
                            <span className="text-[10px] text-slate-400 block">
                              Se desmarcado, o aluno será cadastrado sem cobrança (exibindo o alerta 🔴 Sem cobrança).
                            </span>
                          </div>
                        </label>

                        {formData.create_first_billing && (
                          <div className="space-y-4 pt-2 border-t border-slate-800">
                            {!formData.whatsapp && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>O número de WhatsApp (Etapa 1) é OBRIGATÓRIO quando a primeira cobrança está ativada.</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-300 mb-1">Valor da Mensalidade (R$) *</label>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  required={formData.create_first_billing}
                                  value={formData.billing_amount}
                                  onChange={(e) => setFormData({ ...formData, billing_amount: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-300 mb-1">1º Vencimento *</label>
                                <input
                                  type="date"
                                  required={formData.create_first_billing}
                                  value={formData.billing_due_date}
                                  onChange={(e) => setFormData({ ...formData, billing_due_date: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block font-semibold text-slate-300 mb-1">Dia Vencimento Recorrente Padrão</label>
                              <div className="flex flex-wrap gap-1.5">
                                {[1, 5, 10, 15, 20, 25, 30].map((day) => (
                                  <button
                                    type="button"
                                    key={day}
                                    onClick={() => setFormData({ ...formData, dia_vencimento_recorrente: day })}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                      (formData.dia_vencimento_recorrente || 5) === day
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                    }`}
                                  >
                                    Dia {String(day).padStart(2, '0')}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.is_recurring}
                                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
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

                            <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.send_whatsapp_now || false}
                                  onChange={(e) => setFormData({ ...formData, send_whatsapp_now: e.target.checked })}
                                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                                />
                                <div>
                                  <span className="font-bold text-emerald-400 block text-xs flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Disparar cobrança/chave Pix imediatamente via WhatsApp ao concluir
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Abre o WhatsApp com a mensagem pronta de cobrança assim que você clicar em "Salvar e Concluir".
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </form>
            </div>

            {/* STICKY BOTTOM ACTION BAR (Apple iOS Glass Sheet Footer with 48px Touch Targets) */}
            <div className="sticky bottom-0 z-20 bg-slate-950/90 backdrop-blur-xl p-4 sm:p-5 border-t border-white/10 flex justify-between items-center gap-3 shrink-0 rounded-b-none sm:rounded-b-3xl">
              {wizardMode === 'full' && wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => s - 1)}
                  className="px-4 py-3 rounded-2xl font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center gap-1.5 cursor-pointer transition-all text-xs min-h-[48px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                {wizardMode === 'full' && wizardStep < 5 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="px-5 py-3 rounded-2xl font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 flex items-center gap-1.5 shadow-lg shadow-emerald-400/20 cursor-pointer transition-all text-xs min-h-[48px]"
                  >
                    <span>Próximo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmitWizard}
                  disabled={submitting}
                  className={`px-6 py-3 rounded-2xl font-black transition-all cursor-pointer text-xs flex items-center gap-2 min-h-[48px] ${
                    wizardMode === 'fast'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 text-sm'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {wizardMode === 'fast' ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>
                    {submitting 
                      ? 'Salvando...' 
                      : wizardMode === 'fast' 
                      ? '⚡ Concluir Cadastro em 15s' 
                      : editingStudentId 
                      ? 'Salvar Alterações (Ctrl+S)' 
                      : 'Salvar e Concluir (Ctrl+S)'}
                  </span>
                </button>
              </div>
            </div>
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

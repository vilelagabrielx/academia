'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StickyNote, Plus, Search, Filter, Pin, Trash2, Edit3, User, 
  CreditCard, DollarSign, Sparkles, Check, X, RefreshCw, ChevronDown,
  Calendar, Clock, Tag
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CATEGORIES = [
  { id: 'all', name: 'Todas', color: '#10B981', icon: StickyNote },
  { id: 'student', name: 'Alunos', color: '#3B82F6', icon: User },
  { id: 'billing', name: 'Cobranças', color: '#F59E0B', icon: CreditCard },
  { id: 'expense', name: 'Despesas', color: '#EF4444', icon: DollarSign },
  { id: 'general', name: 'Geral', color: '#8B5CF6', icon: Tag },
];

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
  '#F59E0B', '#EF4444', '#06B6D4', '#64748B'
];

export default function NotesTimelinePage() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auxiliary data for form select
  const [students, setStudents] = useState([]);
  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Modal & Lightbox state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    category: 'general',
    student_id: '',
    billing_id: '',
    expense_id: '',
    title: '',
    content: '',
    color: '#10B981',
    is_pinned: false,
  });

  const observerTarget = useRef(null);

  // Fetch Auxiliary Data for Form
  useEffect(() => {
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => setStudents(data.students || []))
      .catch(() => {});

    fetch('/api/billings')
      .then((res) => res.json())
      .then((data) => setBillings(data.billings || []))
      .catch(() => {});

    fetch('/api/expenses')
      .then((res) => res.json())
      .then((data) => setExpenses(data.expenses || []))
      .catch(() => {});
  }, []);

  // Fetch initial batch (Page 1) or when filters change
  const fetchNotes = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '20');
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (append) {
          setNotes((prev) => [...prev, ...(data.notes || [])]);
        } else {
          setNotes(data.notes || []);
        }
        setHasMore(data.hasMore ?? (data.notes && data.notes.length === 20));
      }
    } catch (err) {
      console.error('Erro ao carregar anotações:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchNotes(1, false);
  }, [selectedCategory, searchQuery, fetchNotes]);

  // Infinite Scroll Trigger via IntersectionObserver
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotes(nextPage, true);
  }, [page, hasMore, loadingMore, fetchNotes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.2 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, loadingMore, handleLoadMore]);

  // Open Modal for New Note
  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setFormData({
      category: 'general',
      student_id: '',
      billing_id: '',
      expense_id: '',
      title: '',
      content: '',
      color: '#10B981',
      is_pinned: false,
    });
    setIsModalOpen(true);
  };

  // Open Modal for Editing Note
  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setFormData({
      category: note.category || 'general',
      student_id: note.student_id ? note.student_id.toString() : '',
      billing_id: note.billing_id ? note.billing_id.toString() : '',
      expense_id: note.expense_id || '',
      title: note.title || '',
      content: note.content || '',
      color: note.color || '#10B981',
      is_pinned: !!note.is_pinned,
    });
    setIsModalOpen(true);
  };

  // Toggle Pin Status
  const handleTogglePin = async (note) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n))
            .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
        );
      }
    } catch (err) {
      console.error('Erro ao fixar anotação:', err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Erro ao excluir anotação:', err);
    }
  };

  // Save Note (Create or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    try {
      const payload = {
        category: formData.category,
        student_id: formData.student_id ? parseInt(formData.student_id, 10) : null,
        billing_id: formData.billing_id ? parseInt(formData.billing_id, 10) : null,
        expense_id: formData.expense_id || null,
        title: formData.title,
        content: formData.content,
        color: formData.color,
        is_pinned: formData.is_pinned,
      };

      if (editingNote) {
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          setPage(1);
          fetchNotes(1, false);
        }
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          setPage(1);
          fetchNotes(1, false);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar anotação:', err);
    }
  };

  // Helper for Category Formatting
  const getCategoryInfo = (catId) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[4];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner - Apple HIG OLED Dark Style */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#161618]/90 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Linha do Tempo em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <StickyNote className="w-7 h-7 text-emerald-400" />
            <span>Linha do Tempo de Anotações</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Acompanhe observações, lembretes de alunos com fotos, cobranças e despesas em uma linha do tempo moderna com carregamento contínuo.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 self-stretch md:self-auto min-h-[44px] cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Criar Anotação</span>
        </button>
      </div>

      {/* Control Bar: Categories & Search (iOS Segmented Control Style) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#141416]/90 p-3.5 sm:p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        {/* Category Tabs (iOS Segmented Control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                    : 'bg-[#1C1C1E] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, aluno ou conteúdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notes Stream / Grid */}
      {loading ? (
        <LoadingSpinner text="Carregando anotações..." size="lg" className="py-12" />
      ) : notes.length === 0 ? (
        <div className="py-20 text-center bg-[#141416]/60 rounded-3xl border border-white/5 p-8 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <StickyNote className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma anotação encontrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Nenhuma anotação corresponde aos seus filtros de busca.'
                : 'Sua linha do tempo está vazia. Crie sua primeira anotação agora mesmo!'}
            </p>
          </div>
          {searchQuery || selectedCategory !== 'all' ? (
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-white/10 text-xs font-semibold text-slate-300 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
            >
              Limpar Filtros
            </button>
          ) : (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Criar Primeira Anotação</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const catInfo = getCategoryInfo(note.category);
            const CatIcon = catInfo.icon;
            const accentColor = note.color || catInfo.color || '#10B981';

            return (
              <div
                key={note.id}
                style={{
                  borderTopColor: accentColor,
                  boxShadow: `0 8px 32px -8px ${accentColor}18`,
                }}
                className={`group relative rounded-2xl bg-[#161618]/90 border border-white/10 border-t-4 p-5 backdrop-blur-xl hover:border-white/20 transition-all flex flex-col justify-between ${
                  note.is_pinned ? 'ring-1 ring-amber-500/40 bg-[#1A1A1E]' : ''
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                      >
                        <CatIcon className="w-3 h-3" />
                        <span>{catInfo.name}</span>
                      </span>

                      {note.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                          <Pin className="w-3 h-3 fill-amber-400" />
                          <span>Fixado</span>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.is_pinned ? 'Desafixar' : 'Fixar no topo'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.is_pinned
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(note)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Prominent Student Photo Header (If Student Category) */}
                  {note.student_id && (note.first_name || note.username) && (
                    <div className="flex items-center gap-3.5 p-3 mb-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/30 shadow-lg">
                      {note.photo_base64 ? (
                        <img
                          src={note.photo_base64}
                          alt={note.first_name || note.username}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({
                              url: note.photo_base64,
                              title: note.first_name ? `${note.first_name} ${note.last_name || ''}` : note.username,
                              subtitle: note.whatsapp ? `WhatsApp: ${note.whatsapp}` : null,
                            });
                          }}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shadow-emerald-500/20 shrink-0 cursor-zoom-in hover:scale-105 transition-transform"
                          title="Clique para ampliar a foto"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-extrabold text-xl shrink-0">
                          {(note.first_name || note.username || 'A')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white truncate">
                            {note.first_name ? `${note.first_name} ${note.last_name || ''}` : note.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">
                          📸 Aluno Vinculado
                        </span>
                        {note.whatsapp && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            WhatsApp: {note.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Title & Content */}
                  {note.title && (
                    <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-1">{note.title}</h4>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  {note.billing_amount && (
                    <span className="text-amber-400 font-bold">
                      R$ {Number(note.billing_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {note.expense_amount && (
                    <span className="text-red-400 font-bold">
                      R$ {Number(note.expense_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Sentinel / Load More Status */}
      <div ref={observerTarget} className="py-6 text-center">
        {loadingMore && (
          <LoadingSpinner text="Carregando mais 20 anotações..." size="md" className="py-2" />
        )}
        {!hasMore && notes.length > 0 && !loading && (
          <p className="text-xs text-slate-500 font-medium">✨ Todas as anotações foram carregadas ({notes.length})</p>
        )}
      </div>

      {/* Modal: Create / Edit Note (100% Mobile-First Apple HIG Bottom Sheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#161618] border border-white/10 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 overflow-hidden">
            <div className="ios-sheet-handle md:hidden mt-2" />
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#161618]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <StickyNote className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingNote ? 'Editar Anotação' : 'Criar Nova Anotação'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const isSelected = formData.category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Sub-select based on category */}
              {formData.category === 'student' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400">Selecione o Aluno (Clique na Foto)</label>
                  
                  {/* Visual Photo Selector Strip */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                    {students.map((s) => {
                      const isSelected = String(s.id) === String(formData.student_id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, student_id: isSelected ? '' : String(s.id) })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s.photo_base64 ? (
                            <img
                              src={s.photo_base64}
                              alt={s.username}
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-lg">
                              {(s.first_name?.[0] || s.username?.[0] || 'A').toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-white max-w-[64px] truncate text-center">
                            {s.first_name || s.username}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ou escolha pela lista...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username}
                      </option>
                    ))}
                  </select>

                  {/* Prominent Featured Selected Student Preview Card */}
                  {(() => {
                    const selStudent = students.find((s) => String(s.id) === String(formData.student_id));
                    if (!selStudent) return null;
                    return (
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-400 shadow-xl shadow-emerald-500/15 animate-in fade-in">
                        {selStudent.photo_base64 ? (
                          <img
                            src={selStudent.photo_base64}
                            alt={selStudent.username}
                            onClick={() =>
                              setPreviewImage({
                                url: selStudent.photo_base64,
                                title: selStudent.first_name
                                  ? `${selStudent.first_name} ${selStudent.last_name || ''}`
                                  : selStudent.username,
                                subtitle: selStudent.whatsapp ? `WhatsApp: ${selStudent.whatsapp}` : null,
                              })
                            }
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg shrink-0 cursor-zoom-in hover:scale-105 transition-transform"
                            title="Clique para ver a foto em tamanho grande"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-2xl shrink-0">
                            {(selStudent.first_name?.[0] || selStudent.username?.[0] || 'A').toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                            📸 Foto do Aluno Vinculada
                          </span>
                          <span className="font-extrabold text-white text-sm block">
                            {selStudent.first_name ? `${selStudent.first_name} ${selStudent.last_name || ''}` : selStudent.username}
                          </span>
                          {selStudent.whatsapp && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              WhatsApp: {selStudent.whatsapp}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {formData.category === 'billing' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Selecione a Cobrança</label>
                  <select
                    value={formData.billing_id}
                    onChange={(e) => setFormData({ ...formData, billing_id: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione uma cobrança (Opcional)</option>
                    {billings.map((b) => (
                      <option key={b.id} value={b.id}>
                        Cobrança #{b.id} - R$ {b.amount} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.category === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Selecione a Despesa</label>
                  <select
                    value={formData.expense_id}
                    onChange={(e) => setFormData({ ...formData, expense_id: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione uma despesa (Opcional)</option>
                    {expenses.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.description} - R$ {ex.amount}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Alinhamento de dieta, Recado importante..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Conteúdo da Anotação *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva sua anotação aqui..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Color picker RGB / Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cor de Destaque (Card RGB)</label>
                <div className="flex items-center gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center cursor-pointer ${
                        formData.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {formData.color === c && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Pin checkbox */}
              <div className="flex items-center gap-2 pt-1 pb-2">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-[#1C1C1E] text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="pinNote" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Fixar esta anotação no topo da linha do tempo
                </label>
              </div>

              {/* Sticky Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-[#161618] py-3 -mb-4 sm:-mb-5 -mx-4 sm:-mx-5 px-4 sm:px-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingNote ? 'Salvar Alterações' : 'Criar Anotação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#161618] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 cursor-default overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10 active:scale-95"
              title="Fechar (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="text-center mb-4 space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                📸 Visualização da Foto do Aluno
              </span>
              <h3 className="text-lg font-black text-white">{previewImage.title || 'Foto do Aluno'}</h3>
              {previewImage.subtitle && (
                <p className="text-xs text-slate-400 font-mono">{previewImage.subtitle}</p>
              )}
            </div>

            {/* Image Container */}
            <div className="relative max-h-[65vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-white/10 p-2 shadow-inner">
              <img
                src={previewImage.url}
                alt={previewImage.title || 'Foto do Aluno'}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <p className="text-[11px] text-slate-500 mt-3 font-medium">Clique em qualquer lugar fora da caixa para fechar</p>
          </div>
        </div>
      )}
    </div>
  );
}

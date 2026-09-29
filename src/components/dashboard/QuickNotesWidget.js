'use client';

import { useState, useEffect } from 'react';
import { 
  Pin, Plus, Trash2, Edit3, Search, Filter, Sparkles, User, 
  CreditCard, DollarSign, StickyNote, Check, X, Palette
} from 'lucide-react';

const DEFAULT_COLOR_PALETTE = [
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Azul iOS', hex: '#3B82F6' },
  { name: 'Rosa Neon', hex: '#EC4899' },
  { name: 'Âmbar Gold', hex: '#F59E0B' },
  { name: 'Roxo Elétrico', hex: '#8B5CF6' },
  { name: 'Ciano Cyber', hex: '#06B6D4' },
  { name: 'Vermelho Rubro', hex: '#EF4444' },
  { name: 'Cinza Platina', hex: '#64748B' },
];

export default function QuickNotesWidget({ students = [], billings = [], expenses = [] }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Note Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category: 'student',
    student_id: '',
    billing_id: '',
    expense_id: '',
    title: '',
    content: '',
    color: '#10B981',
    is_pinned: false
  });

  useEffect(() => {
    fetchNotes();
  }, [filterCategory]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes?category=${filterCategory}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = (categoryType = 'student') => {
    setEditingNote(null);
    setFormData({
      category: categoryType,
      student_id: students[0]?.id || '',
      billing_id: billings[0]?.id || '',
      expense_id: expenses[0]?.id || '',
      title: '',
      content: '',
      color: '#10B981',
      is_pinned: false
    });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({
      category: note.category || 'general',
      student_id: note.student_id || '',
      billing_id: note.billing_id || '',
      expense_id: note.expense_id || '',
      title: note.title || '',
      content: note.content || '',
      color: note.color || '#10B981',
      is_pinned: !!note.is_pinned
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) return;
    setSaving(true);

    try {
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchNotes();
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !note.is_pinned })
      });
      fetchNotes();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta anotação?')) return;
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.first_name && n.first_name.toLowerCase().includes(q)) ||
      (n.username && n.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Apple HIG Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <StickyNote className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Anotações Rápidas</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                {filteredNotes.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Cartões personalizáveis com cores RGB e vínculo direto a alunos e cobranças</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => openNewModal('student')}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Nota de Aluno</span>
          </button>
          <button
            onClick={() => openNewModal('billing')}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cobrança</span>
          </button>
          <button
            onClick={() => openNewModal('expense')}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Despesa</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Apple Segmented Control */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'student', label: '👤 Alunos' },
            { id: 'billing', label: '💳 Cobranças' },
            { id: 'expense', label: '💸 Despesas' },
            { id: 'general', label: '📝 Gerais' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar nas anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs font-semibold">Carregando cartões de anotações...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-12 text-center glass-panel rounded-3xl border border-slate-800 p-8 space-y-3">
          <StickyNote className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs font-medium">Nenhuma anotação encontrada nesta categoria.</p>
          <button
            onClick={() => openNewModal('student')}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            + Criar Primeira Anotação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const hexColor = note.color || '#10B981';
            const selectedStudent = students.find((s) => s.id === note.student_id);
            const photoUrl = note.photo_base64 || selectedStudent?.photo_base64;

            return (
              <div
                key={note.id}
                style={{
                  borderColor: `${hexColor}40`,
                  boxShadow: `0 8px 32px 0 ${hexColor}15`
                }}
                className="relative glass-panel rounded-3xl p-4 border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-3 group bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950"
              >
                {/* Top Header Row with RGB Accent */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    {/* Category & Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: `${hexColor}20`, color: hexColor, borderColor: `${hexColor}40` }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1"
                      >
                        {note.category === 'student' && '👤 Aluno'}
                        {note.category === 'billing' && '💳 Cobrança'}
                        {note.category === 'expense' && '💸 Despesa'}
                        {note.category === 'general' && '📝 Geral'}
                      </span>
                    </div>

                    {/* Action buttons (Pin, Edit, Delete) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.is_pinned ? 'Desafixar' : 'Fixar no topo'}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          note.is_pinned
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => openEditModal(note)}
                        title="Editar anotação"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        title="Excluir anotação"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT STUDENT PHOTO CARD (If Linked to Student) */}
                  {note.category === 'student' && (
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={note.first_name || note.username || 'Aluno'}
                          className="w-12 h-12 rounded-2xl object-cover border-2 shadow-md shrink-0"
                          style={{ borderColor: hexColor }}
                        />
                      ) : (
                        <div
                          style={{ borderColor: `${hexColor}60`, color: hexColor }}
                          className="w-12 h-12 rounded-2xl bg-slate-900 border-2 flex items-center justify-center font-black text-base shrink-0"
                        >
                          {note.first_name?.[0] || note.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-white text-xs truncate">
                          {note.first_name ? `${note.first_name} ${note.last_name || ''}` : note.username || 'Aluno Selecionado'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          @{note.username || 'aluno'} {note.whatsapp ? `• 📱 ${note.whatsapp}` : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Billing Details (If Linked to Billing) */}
                  {note.category === 'billing' && note.billing_amount && (
                    <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cobrança Vinculada:</span>
                        <span className="font-mono text-slate-300 text-[11px] font-bold">
                          Venc: {String(note.billing_due_date).split('T')[0]}
                        </span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm">
                        R$ {parseFloat(note.billing_amount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Expense Details (If Linked to Expense) */}
                  {note.category === 'expense' && note.expense_description && (
                    <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Despesa:</span>
                        <span className="font-bold text-white text-[11px] truncate max-w-[140px] block">
                          {note.expense_description}
                        </span>
                      </div>
                      <span className="font-black text-rose-400 text-sm">
                        R$ {parseFloat(note.expense_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Card Title */}
                  {note.title && (
                    <h3 className="font-bold text-white text-sm tracking-tight leading-snug">
                      {note.title}
                    </h3>
                  )}

                  {/* Note Content Text */}
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {note.content}
                  </p>
                </div>

                {/* Footer Timestamp & Color indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>
                    📅 {new Date(note.created_at || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: hexColor }}
                      className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                    />
                    <span className="font-mono text-[9px] text-slate-400 uppercase">{hexColor}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-emerald-400" />
                <span>{editingNote ? 'Editar Anotação' : 'Nova Anotação Rápida'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Tipo / Vínculo *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'student', label: '👤 Aluno' },
                    { id: 'billing', label: '💳 Cobrança' },
                    { id: 'expense', label: '💸 Despesa' },
                    { id: 'general', label: '📝 Geral' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        formData.category === cat.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Picker with PROMINENT PHOTO */}
              {formData.category === 'student' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Selecione o Aluno *</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="">Selecione o aluno...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username} (@{s.username})
                      </option>
                    ))}
                  </select>

                  {/* Selected Student Photo Preview */}
                  {(() => {
                    const selStudent = students.find((s) => String(s.id) === String(formData.student_id));
                    if (!selStudent) return null;
                    return (
                      <div className="flex items-center gap-3 p-3 mt-2 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/30">
                        {selStudent.photo_base64 ? (
                          <img
                            src={selStudent.photo_base64}
                            alt={selStudent.username}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-lg shrink-0">
                            {selStudent.first_name?.[0] || selStudent.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-white text-xs block">
                            {selStudent.first_name} {selStudent.last_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">@{selStudent.username}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Billing Picker */}
              {formData.category === 'billing' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Selecione a Cobrança *</label>
                  <select
                    value={formData.billing_id}
                    onChange={(e) => setFormData({ ...formData, billing_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="">Selecione a cobrança...</option>
                    {billings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.first_name ? `${b.first_name} ${b.last_name || ''}` : b.username} — R$ {parseFloat(b.amount).toFixed(2)} ({String(b.due_date).split('T')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Expense Picker */}
              {formData.category === 'expense' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Selecione a Despesa *</label>
                  <select
                    value={formData.expense_id}
                    onChange={(e) => setFormData({ ...formData, expense_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-rose-500"
                  >
                    <option value="">Selecione a despesa...</option>
                    {expenses.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.description} — R$ {parseFloat(ex.amount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title (Optional) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título da Anotação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Lembrete de pagamento, Treino personalizado..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Content (Required) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Anotação / Texto *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva sua anotação aqui..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500"
                />
              </div>

              {/* PERSISTENT RGB COLOR SELECTION */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span>Cor do Cartão (RGB / Accent)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Custom RGB Color Picker */}
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                      title="Escolher cor personalizada RGB"
                    />
                    <span
                      style={{ backgroundColor: formData.color }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-950"
                    >
                      {formData.color}
                    </span>
                  </div>
                </div>

                {/* Preset Palettes */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_COLOR_PALETTE.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: p.hex })}
                      style={{ backgroundColor: p.hex }}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md ${
                        formData.color.toLowerCase() === p.hex.toLowerCase()
                          ? 'ring-2 ring-white scale-110'
                          : 'hover:scale-105 opacity-80'
                      }`}
                      title={p.name}
                    >
                      {formData.color.toLowerCase() === p.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned_checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="is_pinned_checkbox" className="text-slate-300 font-semibold cursor-pointer">
                  Fixar este cartão no topo
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all shadow-md cursor-pointer"
                >
                  {saving ? 'Salvação...' : 'Salvar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

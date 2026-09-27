'use client';

import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Tag, FileText } from 'lucide-react';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Exercise Modal
  const [showModal, setShowModal] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', description: '', category_id: 10 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setExercises(data.exercises || []);
    } catch (err) {
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar exercício');

      setShowModal(false);
      setNewEx({ name: '', description: '', category_id: 10 });
      loadExercises();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-emerald-400" />
            Catálogo de Exercícios
          </h1>
          <p className="text-xs text-slate-400 mt-1">Exercícios disponíveis no banco de dados para inclusão nos treinos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Exercício</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício por nome ou grupo..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={loadExercises}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all"
        >
          Buscar
        </button>
      </div>

      {/* Grid of Exercises */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando catálogo de exercícios...</div>
      ) : exercises.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">Nenhum exercício encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-white text-base leading-tight">{ex.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-700 shrink-0">
                    {ex.category_name || 'Geral'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                  {ex.description ? ex.description.replace(/<[^>]*>?/gm, '') : 'Sem descrição cadastrada.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>ID: #{ex.id}</span>
                <span className="text-emerald-400/80">Pronto para treinos</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal New Exercise */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Cadastrar Novo Exercício
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome do Exercício</label>
                <input
                  type="text"
                  required
                  value={newEx.name}
                  onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
                  placeholder="Ex: Supino Reto com Barra"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição / Execução</label>
                <textarea
                  rows={3}
                  value={newEx.description}
                  onChange={(e) => setNewEx({ ...newEx, description: e.target.value })}
                  placeholder="Instruções de execução e postura recomendada..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  {submitting ? 'Salvando...' : 'Salvar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

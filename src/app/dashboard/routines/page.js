'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, Users, Calendar, Trash2, ChevronRight, Eye } from 'lucide-react';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/students'), fetch('/api/routines')])
      .then(async ([sRes, rRes]) => {
        const sData = await sRes.json();
        const rData = await rRes.json();
        setStudents(sData.students || []);
        setRoutines(rData.routines || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta rotina de treino?')) return;
    try {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir treino');
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredRoutines = selectedStudent
    ? routines.filter((r) => r.user_id === parseInt(selectedStudent, 10))
    : routines;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Treinos & Fichas Atribuídas
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gerencie as rotinas de treinos criadas e atribuídas aos alunos.</p>
        </div>
        <Link
          href="/dashboard/routines/new"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all text-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Treino</span>
        </Link>
      </div>

      {/* Filter by Student */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-4">
        <Users className="w-4 h-4 text-slate-500" />
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Todos os Alunos ({students.length})</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} (@{s.username})
            </option>
          ))}
        </select>
      </div>

      {/* Routines Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando treinos...</div>
      ) : filteredRoutines.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">Nenhum treino encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutines.map((routine) => {
            const studentObj = students.find((s) => s.id === routine.user_id);

            return (
              <div
                key={routine.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-base leading-tight">{routine.name}</h3>
                    <button
                      onClick={() => handleDelete(routine.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {routine.description || 'Sem observações adicionais.'}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 px-3 py-2 rounded-xl">
                      <span className="text-slate-500">Aluno Atribuído:</span>
                      <span className="font-semibold text-emerald-400">
                        {studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : `ID #${routine.user_id}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 px-3 py-2 rounded-xl">
                      <span className="text-slate-500">Dias de Treino:</span>
                      <span className="font-bold">{routine.day_count || 1} Dia(s)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(routine.created).toLocaleDateString('pt-BR')}
                  </span>
                  <Link
                    href={`/dashboard/routines/${routine.id}`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <span>Ver Ficha Completa</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

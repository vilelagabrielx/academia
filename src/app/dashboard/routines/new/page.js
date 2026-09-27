'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Dumbbell, User, Clock, Flame, ArrowLeft, Save, Search } from 'lucide-react';

export default function NewRoutinePage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Routine Form State
  const [user_id, setUserId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Workout Days State (e.g. Treino A, Treino B)
  const [days, setDays] = useState([
    {
      name: 'Treino A - Peito e Tríceps',
      description: 'Foco em força e hipertrofia',
      exercises: [],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/students'), fetch('/api/exercises')])
      .then(async ([sRes, eRes]) => {
        const sData = await sRes.json();
        const eData = await eRes.json();
        setStudents(sData.students || []);
        setAllExercises(eData.exercises || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const addDay = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const letter = letters[days.length] || `Day ${days.length + 1}`;
    setDays((prev) => [
      ...prev,
      {
        name: `Treino ${letter}`,
        description: '',
        exercises: [],
      },
    ]);
    setSelectedDayIdx(days.length);
  };

  const removeDay = (idx) => {
    if (days.length <= 1) return alert('O treino deve conter ao menos 1 dia!');
    setDays((prev) => prev.filter((_, i) => i !== idx));
    setSelectedDayIdx(0);
  };

  const addExerciseToDay = (ex) => {
    setDays((prev) => {
      const updated = [...prev];
      const currentExercises = updated[selectedDayIdx].exercises;
      currentExercises.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets: 4,
        reps: 12,
        weight: 10,
        rest: 60,
        comment: '',
      });
      return updated;
    });
  };

  const removeExerciseFromDay = (dayIdx, exIdx) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx].exercises = updated[dayIdx].exercises.filter((_, i) => i !== exIdx);
      return updated;
    });
  };

  const updateExerciseConfig = (dayIdx, exIdx, field, value) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx].exercises[exIdx][field] = value;
      return updated;
    });
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    if (!user_id) return alert('Selecione um aluno para atribuir o treino!');
    if (!name) return alert('Informe o nome da ficha de treino!');

    setSaving(true);
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(user_id, 10),
          name,
          description,
          days,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar treino');

      router.push('/dashboard/routines');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              Montar Nova Ficha de Treino
            </h1>
            <p className="text-xs text-slate-400">Monte séries, cargas e descansos personalizados por dia de treino.</p>
          </div>
        </div>

        <button
          onClick={handleSaveRoutine}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Salvar e Atribuir Treino'}</span>
        </button>
      </div>

      {/* Routine Main Info Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Selecione o Aluno *</label>
          <select
            value={user_id}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Selecionar Aluno --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} (@{s.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Treino / Rotina *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Hipertrofia ABC (Outubro)"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Observações do Treino</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Aquecer 10 min na esteira antes dos treinos"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Days Tabs & Workout Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Days & Exercise List Builder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Days Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {days.map((day, dIdx) => (
              <button
                key={dIdx}
                type="button"
                onClick={() => setSelectedDayIdx(dIdx)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedDayIdx === dIdx
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{day.name}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px]">
                  {day.exercises.length} ex
                </span>
              </button>
            ))}
            <button
              onClick={addDay}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Dia</span>
            </button>
          </div>

          {/* Current Day Details Header */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <input
              type="text"
              value={days[selectedDayIdx]?.name || ''}
              onChange={(e) => {
                const updated = [...days];
                updated[selectedDayIdx].name = e.target.value;
                setDays(updated);
              }}
              className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-emerald-500"
              placeholder="Nome do Dia (Ex: Treino A)"
            />
            <button
              onClick={() => removeDay(selectedDayIdx)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir Dia
            </button>
          </div>

          {/* Exercises assigned to current day */}
          <div className="space-y-3">
            {days[selectedDayIdx]?.exercises.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl border border-dashed border-slate-800">
                Nenhum exercício adicionado a este dia. Escolha exercícios no painel ao lado!
              </div>
            ) : (
              days[selectedDayIdx]?.exercises.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        {exIdx + 1}
                      </span>
                      {ex.exercise_name}
                    </span>
                    <button
                      onClick={() => removeExerciseFromDay(selectedDayIdx, exIdx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid for Sets, Reps, Weight, Rest */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                        Séries (Sets)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ex.sets}
                        onChange={(e) => updateExerciseConfig(selectedDayIdx, exIdx, 'sets', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                        Repetições
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ex.reps}
                        onChange={(e) => updateExerciseConfig(selectedDayIdx, exIdx, 'reps', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                        Carga Inicial (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={ex.weight}
                        onChange={(e) => updateExerciseConfig(selectedDayIdx, exIdx, 'weight', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                        Descanso (seg)
                      </label>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={ex.rest}
                        onChange={(e) => updateExerciseConfig(selectedDayIdx, exIdx, 'rest', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={ex.comment}
                      onChange={(e) => updateExerciseConfig(selectedDayIdx, exIdx, 'comment', e.target.value)}
                      placeholder="Observações de execução (Ex: Cadência 3x1, Drop-set na última série)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Search & Add Exercises */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            Adicionar Exercícios ao {days[selectedDayIdx]?.name}
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício no banco..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-2 transition-all"
              >
                <div>
                  <span className="block font-semibold text-xs text-white leading-tight">{ex.name}</span>
                  <span className="text-[10px] text-slate-500 block">{ex.category_name || 'Geral'}</span>
                </div>
                <button
                  onClick={() => addExerciseToDay(ex)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-all shrink-0"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

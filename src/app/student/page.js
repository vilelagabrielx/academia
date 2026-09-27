'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, CheckCircle2, Clock, Play, RotateCcw, Award, LogOut, History, CreditCard, ChevronRight, Activity, MessageSquare } from 'lucide-react';

export default function StudentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Execution State for Current Workout Session
  const [executedLogs, setExecutedLogs] = useState({}); // key: exercise_id -> { weight, reps, done }
  const [sessionNotes, setSessionNotes] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [finishedSuccess, setFinishedSuccess] = useState(false);

  // Interactive Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/');
        } else {
          setUser(data.user);
          loadStudentRoutine(data.user.id);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const loadStudentRoutine = async (userId) => {
    try {
      const res = await fetch(`/api/routines?user_id=${userId}`);
      const data = await res.json();
      if (data.routines && data.routines.length > 0) {
        const activeRoutineId = data.routines[0].id;
        const detailRes = await fetch(`/api/routines/${activeRoutineId}`);
        const detailData = await detailRes.json();
        setRoutine(detailData.routine);
      }
    } catch (err) {
      console.error('Error loading student routine:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds) => {
    setTimerSeconds(seconds || 60);
    setTimerActive(true);
  };

  const handleUpdateLog = (exId, field, val, defaultRest) => {
    setExecutedLogs((prev) => {
      const current = prev[exId] || { weight: '', reps: '', done: false };
      const updated = { ...current, [field]: val };
      if (field === 'done' && val === true && defaultRest) {
        startTimer(defaultRest);
      }
      return { ...prev, [exId]: updated };
    });
  };

  const handleFinishWorkout = async () => {
    if (!routine || !routine.days[selectedDayIdx]) return;
    const currentDay = routine.days[selectedDayIdx];

    setFinishing(true);
    try {
      const logsArray = [];
      currentDay.slots.forEach((slot) => {
        slot.entries.forEach((entry) => {
          const logData = executedLogs[entry.exercise_id] || {};
          logsArray.push({
            exercise_id: entry.exercise_id,
            slot_entry_id: entry.id,
            weight: logData.weight || entry.weight,
            reps: logData.reps || entry.reps,
            weight_target: entry.weight,
            reps_target: entry.reps,
            rest: entry.rest,
          });
        });
      });

      const res = await fetch('/api/workout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routine_id: routine.id,
          day_id: currentDay.id,
          notes: sessionNotes,
          logs: logsArray,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar treino realizado');

      setFinishedSuccess(true);
      setTimeout(() => setFinishedSuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setFinishing(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Carregando seu treino...
      </div>
    );
  }

  const currentDay = routine?.days?.[selectedDayIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Student App Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Meu Treino
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">
                Portal Aluno
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/student/billings"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Mensalidades</span>
            </Link>
            <Link
              href="/student/history"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Rest Timer Floating Widget */}
      {timerActive && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel p-4 rounded-2xl border-2 border-emerald-500/80 shadow-2xl bg-slate-900/95 flex items-center gap-4 animate-bounce">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-2xl font-mono">
            {timerSeconds}s
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Descanso em Andamento</span>
            <span className="text-[10px] text-slate-400 block">Respire fundo para a próxima série</span>
          </div>
          <button
            onClick={() => setTimerActive(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        {/* Welcome Card */}
        {user && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-emerald-950/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Bem-vindo(a) de volta,</span>
              <h1 className="text-xl font-extrabold text-white">
                {user.first_name || user.username}!
              </h1>
            </div>
            {routine && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                {routine.name}
              </span>
            )}
          </div>
        )}

        {finishedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>Parabéns! Treino finalizado e salvo no seu histórico com sucesso!</span>
          </div>
        )}

        {!routine ? (
          <div className="glass-panel p-12 text-center text-slate-500 text-sm rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Dumbbell className="w-10 h-10 mx-auto text-slate-600" />
            <p>Você ainda não possui nenhuma ficha de treino atribuída.</p>
            <p className="text-xs">Peça ao seu professor/personal para cadastrar seu treino!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workout Days Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {routine.days.map((day, idx) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all text-center border ${
                    selectedDayIdx === idx
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-extrabold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>

            {/* Current Day Exercises List */}
            {currentDay && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    {currentDay.name}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {currentDay.slots.reduce((acc, s) => acc + s.entries.length, 0)} exercícios
                  </span>
                </div>

                {currentDay.slots.map((slot) =>
                  slot.entries.map((entry) => {
                    const exLog = executedLogs[entry.exercise_id] || {};
                    const isDone = exLog.done || false;

                    return (
                      <div
                        key={entry.id}
                        className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 ${
                          isDone
                            ? 'border-emerald-500/50 bg-emerald-950/10'
                            : 'border-slate-800 bg-slate-900/70'
                        }`}
                      >
                        {/* Exercise Name & Target Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-extrabold text-white text-base">{entry.exercise_name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{entry.exercise_description}</p>
                          </div>
                          <button
                            onClick={() => handleUpdateLog(entry.exercise_id, 'done', !isDone, entry.rest)}
                            className={`p-2 rounded-xl transition-all ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-6 h-6" />
                          </button>
                        </div>

                        {/* Targets Badge */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 font-semibold border border-slate-700">
                            Meta: {entry.sets} séries x {entry.reps} reps
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                            Carga Alvo: {entry.weight} kg
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                            Descanso: {entry.rest}s
                          </span>
                        </div>

                        {entry.comment && (
                          <div className="text-xs text-amber-400/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 font-medium">
                            💡 {entry.comment}
                          </div>
                        )}

                        {/* Input for Executed Weight & Reps */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                              Carga Realizada (kg)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder={`${entry.weight}`}
                              value={exLog.weight !== undefined ? exLog.weight : entry.weight}
                              onChange={(e) => handleUpdateLog(entry.exercise_id, 'weight', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                              Reps Realizadas
                            </label>
                            <input
                              type="number"
                              placeholder={`${entry.reps}`}
                              value={exLog.reps !== undefined ? exLog.reps : entry.reps}
                              onChange={(e) => handleUpdateLog(entry.exercise_id, 'reps', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Session Notes & Finish Button */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/80">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Observações do Treino de Hoje (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Ex: Aumentei 2kg no supino, senti facilidade..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleFinishWorkout}
                    disabled={finishing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Award className="w-5 h-5" />
                    <span>{finishing ? 'Salvando Treino...' : 'Finalizar e Salvar Treino de Hoje'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

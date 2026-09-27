'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Calendar, Dumbbell, User, Award, TrendingUp } from 'lucide-react';

export default function StudentHistoryPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [history, setHistory] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/students'),
      fetch(`/api/students/${id}/history`),
    ])
      .then(async ([sRes, hRes]) => {
        const sData = await sRes.json();
        const hData = await hRes.json();
        const found = sData.students?.find((s) => s.id === parseInt(id, 10));
        setStudent(found);
        setHistory(hData.history || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Group history logs by session_id
  const sessions = history.reduce((acc, curr) => {
    if (!acc[curr.session_id]) {
      acc[curr.session_id] = {
        session_id: curr.session_id,
        datetime_start: curr.datetime_start,
        routine_name: curr.routine_name,
        day_name: curr.day_name,
        notes: curr.notes,
        logs: [],
      };
    }
    if (curr.exercise_name) {
      acc[curr.session_id].logs.push(curr);
    }
    return acc;
  }, {});

  const sessionList = Object.values(sessions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Evolução e Histórico de Treinos
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe a frequência, cargas e repetições executadas pelo aluno.
          </p>
        </div>
      </div>

      {/* Student Banner */}
      {student && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4 bg-slate-900/60">
          {student.photo_base64 ? (
            <img
              src={student.photo_base64}
              alt={student.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xl">
              {student.first_name?.[0] || student.username[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">
              {student.first_name} {student.last_name}
            </h2>
            <span className="text-xs text-slate-400 block font-mono">@{student.username}</span>
            {student.whatsapp && (
              <span className="text-xs text-emerald-400 mt-1 block">WhatsApp: {student.whatsapp}</span>
            )}
          </div>
        </div>
      )}

      {/* Workout History Sessions List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Carregando histórico...</div>
      ) : sessionList.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-500 text-sm rounded-2xl border border-dashed border-slate-800">
          Nenhum treino registrado ainda por este aluno.
        </div>
      ) : (
        <div className="space-y-4">
          {sessionList.map((session) => (
            <div key={session.session_id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="font-bold text-white text-base block">{session.routine_name || 'Treino Geral'}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{session.day_name || 'Sessão Executada'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{new Date(session.datetime_start).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 uppercase text-[10px] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Exercício</th>
                      <th className="py-2.5 px-3 text-center">Carga Realizada</th>
                      <th className="py-2.5 px-3 text-center">Reps Realizadas</th>
                      <th className="py-2.5 px-3 text-center">Meta (Alvo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {session.logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">{log.exercise_name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{log.weight} kg</td>
                        <td className="py-2.5 px-3 text-center font-bold text-cyan-400">{log.repetitions} reps</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {log.weight_target} kg / {log.repetitions_target} reps
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {session.notes && (
                <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 italic">
                  &ldquo;{session.notes}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

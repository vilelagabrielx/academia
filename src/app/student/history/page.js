'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Dumbbell, Activity, CheckCircle2 } from 'lucide-react';

export default function StudentHistoryPortalPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/');
        } else {
          loadHistory(data.user.id);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  const loadHistory = async (userId) => {
    try {
      const res = await fetch(`/api/students/${userId}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group logs by session_id
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Meu Histórico de Treinos
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">
                Evolução de Cargas
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando seu histórico...</div>
        ) : sessionList.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 text-sm rounded-2xl border border-dashed border-slate-800">
            Nenhum treino realizado ainda. Finalize um treino para que ele apareça aqui!
          </div>
        ) : (
          <div className="space-y-4">
            {sessionList.map((session) => (
              <div key={session.session_id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{session.routine_name || 'Treino'}</h3>
                    <span className="text-xs text-emerald-400 font-semibold">{session.day_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(session.datetime_start).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Exercício</th>
                        <th className="py-2.5 px-3 text-center">Carga Executada</th>
                        <th className="py-2.5 px-3 text-center">Reps Realizadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {session.logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-semibold text-white">{log.exercise_name}</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-400">{log.weight} kg</td>
                          <td className="py-2 px-3 text-center font-bold text-cyan-400">{log.repetitions} reps</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {session.notes && (
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 italic">
                    &ldquo;{session.notes}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

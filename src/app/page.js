'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell, UserCheck, ShieldCheck, ArrowRight, Lock, User, AlertCircle,
  Check, Star, Shield, Zap, Award, Flame, MessageCircle, Instagram
} from 'lucide-react';

export default function LandingAndLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('trainer'); // 'trainer' or 'student'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.is_staff || data.user.is_superuser) {
            router.push('/dashboard');
          } else {
            router.push('/student');
          }
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no login. Verifique seu usuário e senha.');
      }

      if (data.user.is_staff || data.user.is_superuser || role === 'trainer') {
        router.push('/dashboard');
      } else {
        router.push('/student');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = 'https://wa.me/5521966239956?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20me%20matricular%20na%20Iron%20Solder%20Gym.';
  const instagramUrl = 'https://instagram.com/iron_soldergym';

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-[#D4AF37]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col justify-between selection:bg-[#D4AF37] selection:text-black">

      {/* Navbar Header */}
      <header className="border-b border-[#D4AF37]/20 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1F1F1F] border border-[#D4AF37]/40 p-1 flex items-center justify-center shadow-lg shadow-black/60">
              <img src="/logo.png" alt="Iron Solder Gym Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bebas text-2xl sm:text-3xl tracking-wider text-white block leading-none">
                IRON SOLDER GYM
              </span>
              <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold block">
                Foco &bull; Disciplina &bull; Resultados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 transition-all"
            >
              Área de Membros
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] hover:bg-[#C5A059] text-black font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 transition-all text-xs uppercase tracking-wider"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Matricule-se</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero Banner */}
      <main className="flex-1 space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <section className="text-center relative py-8 sm:py-12 px-4 sm:px-6 rounded-3xl glass-panel-gold border border-[#D4AF37]/30 overflow-hidden space-y-6 sm:space-y-8 bg-gradient-to-b from-[#1F1F1F] via-[#121212] to-[#0D0D0D]">

          {/* Logo Centralizada */}
          <div className="flex justify-center">
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl bg-[#121212] border-2 border-[#D4AF37] p-2 flex items-center justify-center shadow-2xl shadow-black/80">
              <img src="/logo.png" alt="Iron Solder Gym" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Chamada de Impacto */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="font-bebas text-4xl sm:text-7xl font-extrabold tracking-wider text-white uppercase leading-none">
              OS MELHORES PLANOS ESTÃO AQUI
            </h1>
            <p className="text-[#A6A6A6] text-sm sm:text-base font-montserrat max-w-xl mx-auto">
              Ambiente de alto rendimento com equipamentos modernos, acompanhamento profissional e estrutura completa para você superar todos os seus limites.
            </p>

            {/* Preço em Destaque */}
            <div className="inline-block bg-[#1F1F1F] border border-[#D4AF37]/50 px-6 py-3 rounded-2xl shadow-xl">
              <span className="text-xs text-[#A6A6A6] uppercase tracking-widest block font-bold">Mensalidades acessíveis</span>
              <span className="font-bebas text-3xl sm:text-4xl text-[#D4AF37] tracking-wide block">
                A PARTIR DE R$ XX,XX / MÊS
              </span>
            </div>
          </div>

          {/* Botão Principal CTA */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#D4AF37] hover:bg-[#C5A059] text-black font-extrabold px-8 py-4 rounded-2xl text-base sm:text-lg shadow-xl shadow-[#D4AF37]/25 transition-all hover:scale-105 uppercase tracking-wider cursor-pointer"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Matricule-se pelo WhatsApp</span>
            </a>
          </div>
        </section>

        {/* Seção de Diferenciais / Benefícios (Grade de Ícones) */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-bebas text-4xl sm:text-5xl text-white tracking-wider uppercase">
              POR QUE TREINAR NA IRON SOLDER GYM?
            </h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all space-y-3 bg-[#1F1F1F]/80">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white tracking-wide">Acesso Livre à Musculação</h3>
              <p className="text-xs text-[#A6A6A6] leading-relaxed">
                Treine com total liberdade na nossa área de musculação estruturada para hipertrofia e definição.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all space-y-3 bg-[#1F1F1F]/80">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white tracking-wide">Equipamentos de Ponta</h3>
              <p className="text-xs text-[#A6A6A6] leading-relaxed">
                Maquinário moderno, biomecânica precisa e manutenção constante para garatir o máximo desempenho.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all space-y-3 bg-[#1F1F1F]/80">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white tracking-wide">Acompanhamento Profissional</h3>
              <p className="text-xs text-[#A6A6A6] leading-relaxed">
                Profissionais qualificados para montagem de fichas e orientação diária no cumprimento dos seus treinos.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all space-y-3 bg-[#1F1F1F]/80">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white tracking-wide">Ambiente Exclusivo</h3>
              <p className="text-xs text-[#A6A6A6] leading-relaxed">
                Vibe focada na disciplina, energia motivação constante para você superar suas próprias metas todos os dias.
              </p>
            </div>
          </div>
        </section>

        {/* Seção de Planos e Valores */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-bebas text-4xl sm:text-5xl text-white tracking-wider uppercase">
              PLANOS & MODALIDADES
            </h2>
            <p className="text-xs text-[#A6A6A6] uppercase tracking-widest font-semibold">Escolha a melhor opção para a sua rotina</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plano Mensal */}
            <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all flex flex-col justify-between space-y-6 bg-[#1F1F1F]">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  Plano Mensal
                </span>
                <div>
                  <span className="font-bebas text-5xl text-white tracking-tight">R$ XX,XX</span>
                  <span className="text-xs text-[#A6A6A6] block">/ mês sem fidelidade</span>
                </div>
                <ul className="space-y-2 text-xs text-[#A6A6A6]">
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Acesso Livre à Musculação
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Montagem de Ficha de Treino
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Acompanhamento de Cargas no App
                  </li>
                </ul>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#2A2A2A] hover:bg-[#D4AF37] hover:text-black font-extrabold text-xs uppercase tracking-wider text-white text-center border border-[#D4AF37]/40 transition-all block"
              >
                Quero o Plano Mensal
              </a>
            </div>

            {/* Plano VIP Recorrente (Destaque) */}
            <div className="glass-panel p-5 sm:p-8 rounded-3xl border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/15 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#2A2A2A] to-[#1F1F1F] relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black font-extrabold px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-md">
                MAIS RECOMENDADO
              </div>
              <div className="space-y-4 pt-2">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider">
                  Mensalidade VIP Recorrente
                </span>
                <div>
                  <span className="font-bebas text-5xl text-[#D4AF37] tracking-tight">R$ XX,XX</span>
                  <span className="text-xs text-white block">/ mês no débito automático / Pix</span>
                </div>
                <ul className="space-y-2 text-xs text-white">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Acesso Total sem Restrição
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Ficha Digital Personalizada no Sistema
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Timer de Descanso & Histórico Completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Lembrete Automático de Renovação
                  </li>
                </ul>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-black font-black text-xs uppercase tracking-wider text-center transition-all shadow-lg shadow-[#D4AF37]/20 block"
              >
                Matricular com Desconto
              </a>
            </div>

            {/* Plano Trimestral */}
            <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all flex flex-col justify-between space-y-6 bg-[#1F1F1F]">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  Plano Trimestral
                </span>
                <div>
                  <span className="font-bebas text-5xl text-white tracking-tight">R$ XX,XX</span>
                  <span className="text-xs text-[#A6A6A6] block">/ mês (plano de 3 meses)</span>
                </div>
                <ul className="space-y-2 text-xs text-[#A6A6A6]">
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Economia Garantida
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Avaliação Física Inclusa
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Ficha Atualizada Periodicamente
                  </li>
                </ul>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#2A2A2A] hover:bg-[#D4AF37] hover:text-black font-extrabold text-xs uppercase tracking-wider text-white text-center border border-[#D4AF37]/40 transition-all block"
              >
                Quero o Trimestral
              </a>
            </div>
          </div>
        </section>

        {/* Portal de Login de Membros (Professor / Aluno) */}
        <section id="login" className="pt-4 sm:pt-8">
          <div className="max-w-md mx-auto glass-panel p-5 sm:p-8 rounded-3xl border-2 border-[#D4AF37]/40 bg-[#121212] shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-[#1F1F1F] border border-[#D4AF37] p-1 mx-auto flex items-center justify-center">
                <img src="/logo.png" alt="Iron Solder Gym" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-bebas text-3xl text-white tracking-wide">ÁREA DE MEMBROS</h3>
              <p className="text-xs text-[#A6A6A6]">Acesse seus treinos ou painel administrativo</p>
            </div>

            {/* Selector Professor vs Aluno */}
            <div className="flex bg-[#1F1F1F] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRole('trainer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${role === 'trainer'
                  ? 'bg-[#D4AF37] text-black font-extrabold shadow-md'
                  : 'text-[#A6A6A6] hover:text-white'
                  }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Professor
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${role === 'student'
                  ? 'bg-[#D4AF37] text-black font-extrabold shadow-md'
                  : 'text-[#A6A6A6] hover:text-white'
                  }`}
              >
                <UserCheck className="w-4 h-4" />
                Aluno
              </button>
            </div>

            {role === 'student' ? (
              <div className="py-8 text-center space-y-3 bg-[#1F1F1F]/60 rounded-2xl border border-slate-800 p-6">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                  <UserCheck className="w-6 h-6 opacity-60" />
                </div>
                <h4 className="font-bold text-slate-300 text-sm">Área do Aluno</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                  No futuro o aluno acessaria por aqui e teria acesso a treinos dietas conteudos ETC
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#A6A6A6] uppercase tracking-wider mb-2">
                      Usuário ou E-mail
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full bg-[#1F1F1F] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#A6A6A6] uppercase tracking-wider mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1F1F1F] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[#D4AF37] hover:bg-[#C5A059] text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Entrar no Sistema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/20 bg-[#121212] py-8 text-center text-xs text-[#A6A6A6] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1F1F1F] border border-[#D4AF37]/40 p-0.5">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bebas text-xl text-white tracking-wider">IRON SOLDER GYM</span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F1F1F] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold transition-all text-xs"
              >
                <Instagram className="w-4 h-4" />
                <span>@iron_soldergym</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold transition-all text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>(21) 96623-9956</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Iron Solder Gym &copy; 2026 &bull; Foco, Disciplina e Resultados. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Fale conosco no WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 rounded-full shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-all flex items-center justify-center cursor-pointer border-2 border-white"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
      </a>

    </div>
  );
}

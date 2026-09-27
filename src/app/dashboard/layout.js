'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Users, Activity, FileText, LogOut, LayoutDashboard, CreditCard, Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const navItems = [
    { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Alunos', href: '/dashboard/students', icon: Users },
    { label: 'Treinos', href: '/dashboard/routines', icon: FileText },
    { label: 'Exercícios', href: '/dashboard/exercises', icon: Dumbbell },
    { label: 'Financeiro', href: '/dashboard/billings', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]">
      {/* iOS Top Navigation Bar (Header) */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group active:scale-95 transition-transform">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#1F1F24] to-[#121215] border border-[#D4AF37]/30 p-1.5 flex items-center justify-center shadow-lg group-hover:border-[#D4AF37] transition-all">
              <img src="/logo.png" alt="IRON SOLDIER GYM" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bebas text-xl sm:text-2xl tracking-wider text-white block leading-none">IRON SOLDIER GYM</span>
              <span className="text-[9px] sm:text-[10px] text-[#D4AF37] uppercase tracking-widest font-semibold block mt-0.5">Gestão de Performance</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#1C1C1E]/60 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="text-right">
                <span className="text-xs font-bold text-white block">{user.first_name || user.username}</span>
                <span className="text-[10px] text-[#D4AF37] block font-mono">{user.email || 'Professor'}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Profile & Drawer Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                {(user.first_name || user.username || 'P')[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/10 active:scale-95 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#D4AF37]" /> : <Menu className="w-5 h-5 text-[#D4AF37]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Options / Profile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#161618]/95 border-b border-white/10 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-white block">{user?.first_name || user?.username}</span>
                <span className="text-[10px] text-[#D4AF37] font-mono">{user?.email || 'Professor / Administrador'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
                      : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
        {children}
      </main>

      {/* iOS Mobile Bottom Navigation Bar (Tab Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121214]/90 backdrop-blur-2xl border-t border-white/10 pb-safe pt-2 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? 'text-[#D4AF37]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]/40 scale-110' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] tracking-tight font-medium mt-0.5 ${
                  isActive ? 'font-bold text-[#D4AF37]' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Users, Activity, FileText, LogOut, LayoutDashboard, CreditCard, Menu, X, TrendingDown } from 'lucide-react';

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
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Alunos', href: '/dashboard/students', icon: Users },
    { label: 'Treinos', href: '/dashboard/routines', icon: FileText },
    { label: 'Exercícios', href: '/dashboard/exercises', icon: Dumbbell },
    { label: 'Financeiro', href: '/dashboard/billings', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1F1F1F] border border-[#D4AF37]/30 p-1 flex items-center justify-center shadow-lg shadow-black/50 group-hover:border-[#D4AF37] transition-all">
              <img src="/logo.png" alt="IRON SOLDIER GYM" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bebas text-xl sm:text-2xl tracking-wider text-white block leading-none">IRON SOLDIER GYM</span>
              <span className="text-[9px] sm:text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Painel de Gestão</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-[#D4AF37] text-black font-extrabold shadow-lg shadow-[#D4AF37]/20'
                      : 'text-slate-300 hover:text-white hover:bg-[#1F1F1F] hover:border hover:border-[#D4AF37]/30'
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
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1F1F1F] active:bg-[#2A2A2A]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6 text-[#D4AF37]" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#121212] border-b border-[#D4AF37]/20 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'bg-[#D4AF37] text-black font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-[#1F1F1F]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

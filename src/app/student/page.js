'use client';

import { Lightbulb } from 'lucide-react';

export default function StudentPortalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        <Lightbulb className="w-8 h-8 text-slate-500 opacity-60" />
      </div>
      
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-bold text-slate-400">Área do Aluno</h1>
        <p className="text-sm font-medium text-slate-500">
          No futuro o aluno acessaria por aqui e teria acesso a treinos dietas conteudos ETC
        </p>
      </div>
    </div>
  );
}

'use client';

import { Lightbulb } from 'lucide-react';

export default function ExercisesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        <Lightbulb className="w-8 h-8 text-slate-500 opacity-60" />
      </div>
      
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-bold text-slate-400">Exercícios</h1>
        <p className="text-sm font-medium text-slate-500">
          Essa funcionalidade não existe, é só uma ideia.. quem sabe no futuro
        </p>
      </div>
    </div>
  );
}

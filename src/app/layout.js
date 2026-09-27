import './globals.css';

export const metadata = {
  title: 'Sistema de Academia & Gestão de Treinos',
  description: 'Plataforma completa para professores, personal trainers e alunos.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

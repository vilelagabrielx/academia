import './globals.css';

export const metadata = {
  title: 'IRON SOLDER GYM - Sistema de Academia & Gestão de Treinos',
  description: 'Os melhores planos estão aqui. Treine com foco, disciplina e superação.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0D0D0D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark" style={{ backgroundColor: '#0D0D0D' }}>
      <head>
        <meta name="theme-color" content="#0D0D0D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;800;900&family=Teko:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0D0D0D] text-white min-h-screen antialiased selection:bg-[#D4AF37] selection:text-black" style={{ backgroundColor: '#0D0D0D' }}>
        {children}
      </body>
    </html>
  );
}

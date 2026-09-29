'use client';

export default function LoadingSpinner({ text = 'Carregando...', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  const imgSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex flex-col items-center justify-center p-4 space-y-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <picture>
          <source srcSet="/loading.webp" type="image/webp" />
          <img
            src="/loading.gif"
            alt="Carregando..."
            className={`${imgSize} object-contain filter drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]`}
          />
        </picture>
      </div>
      {text && (
        <span className="text-[11px] font-extrabold tracking-wider text-emerald-400/90 uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

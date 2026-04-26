import React from 'react';

export function Logo({ className = "h-8", ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} {...(props as any)}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 30L80 0V30L0 60V30Z" fill="white" />
        <path d="M0 65L65 42.5V72.5L0 95V65Z" fill="white" />
        <path d="M30 90L65 77.5V107.5L30 120V90Z" fill="white" />
      </svg>
      <span className="font-mono font-bold text-white tracking-tight text-3xl lowercase">eleprim</span>
    </div>
  );
}

import React from 'react';

export function Logo({ className = "h-8", ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} {...(props as any)}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="15" rx="2" fill="white" transform="skewX(-20)" />
        <rect x="25" y="45" width="50" height="15" rx="2" fill="white" transform="skewX(-20)" />
        <rect x="30" y="70" width="40" height="15" rx="2" fill="white" transform="skewX(-20)" />
      </svg>
      <span className="font-mono font-bold text-white tracking-widest text-2xl lowercase">eleprim</span>
    </div>
  );
}

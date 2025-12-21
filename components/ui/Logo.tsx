
import React from 'react';
import { TrophyIcon, SchoolIcon } from './Icons';

interface LogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackIcon?: 'trophy' | 'school';
  padding?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
    src, 
    alt = "Logo", 
    className = "w-12 h-12", 
    fallbackIcon = 'trophy',
    padding = "p-1.5"
}) => {
  return (
    <div className={`rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border border-white/30 shrink-0 ${className}`}>
      {src ? (
        <img 
            src={src} 
            alt={alt} 
            className={`w-full h-full object-contain ${padding}`} 
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-slate-100');
            }} 
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-50">
            {fallbackIcon === 'trophy' ? (
                <TrophyIcon className="w-1/2 h-1/2 text-amber-500" />
            ) : (
                <SchoolIcon className="w-1/2 h-1/2 text-blue-500" />
            )}
        </div>
      )}
    </div>
  );
};

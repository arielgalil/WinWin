
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
  const [error, setError] = React.useState(false);

  return (
    <div className={`rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 no-select no-drag ${className}`}>
      {src && !error ? (
        <img 
            src={src} 
            alt={alt} 
            className={`w-full h-full object-contain ${padding}`} 
            onError={() => setError(true)} 
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-50 dark:bg-slate-950">
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

import React, { memo } from 'react';

interface LeaderIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LeaderIcon: React.FC<LeaderIconProps> = memo(({ 
  className = '',
  size = 'md'
}) => {
  // Map sizes to Container Dimensions and Icon Font Sizes (Material Icons use text size)
  let containerClass = '';
  let iconSizeClass = '';

  switch (size) {
    case 'sm':
      containerClass = 'w-8 h-8';
      iconSizeClass = 'text-xl';
      break;
    case 'lg': 
      containerClass = 'w-20 h-20'; 
      iconSizeClass = 'text-5xl';
      break;
    case 'md':
    default:
      containerClass = 'w-[clamp(2.4rem,3.8vw,4.5rem)] h-[clamp(2.4rem,3.8vw,4.5rem)]';
      iconSizeClass = 'clamp(1.8rem,2.8vw,3.4rem)';
      break;
  }

  // Allow className to override dimensions if provided
  if (className.includes('w-') || className.includes('h-')) {
    containerClass = '';
  }

  return (
    <div 
        data-testid="leader-icon-container" 
        className={`relative flex items-center justify-center ${containerClass} ${className}`}
    >
      <div 
          data-testid="leader-icon-circle"
          className="rounded-full bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center backdrop-blur-md w-full h-full shadow-[0_0_15px_rgba(234,179,8,0.3)]"
      >
        <span
          className="material-symbols-rounded text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]"
          style={{ fontSize: iconSizeClass, width: '1em', height: '1em', lineHeight: 1, fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }}
          aria-hidden="true"
        >crown</span>
      </div>
    </div>
  );
});

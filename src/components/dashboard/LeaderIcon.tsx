import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CrownIcon } from '../ui/Icons';

interface LeaderIconProps {
  animated?: boolean;
  className?: string;
}

const MotionDiv = motion.div as any;

export const LeaderIcon: React.FC<LeaderIconProps> = memo(({ 
  animated = true, 
  className = ''
}) => {
  // Default size if not provided in className
  const sizeClass = (className.includes('w-') || className.includes('h-')) ? '' : 'w-12 h-12 md:w-16 md:h-16';

  const content = (
    <div 
        data-testid="leader-icon-circle"
        className="rounded-full bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center backdrop-blur-md w-full h-full"
    >
      <CrownIcon className="w-[66%] h-[66%] text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
    </div>
  );

  if (animated) {
    return (
      <MotionDiv
        data-testid="leader-icon-container"
        className={`relative flex items-center justify-center ${sizeClass} ${className}`}
        animate={{ y: [-3, 0, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {content}
      </MotionDiv>
    );
  }

  return (
    <div 
        data-testid="leader-icon-container" 
        className={`relative flex items-center justify-center ${sizeClass} ${className}`}
    >
      {content}
    </div>
  );
});

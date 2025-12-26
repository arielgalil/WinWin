
import React from 'react';
import { PauseIcon, LockIcon } from './Icons';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface FrozenOverlayProps {
  isFrozen: boolean;
}

export const FrozenOverlay: React.FC<FrozenOverlayProps> = ({ isFrozen }) => {
  const { t, dir } = useLanguage();
  if (!isFrozen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto flex flex-col" dir={dir}>
      {/* Reddish Tint Backdrop - Blocks Clicks */}
      <div className="absolute inset-0 bg-red-900/20 backdrop-grayscale-[0.5] backdrop-blur-[2px]" />

      {/* Top Banner */}
      <MotionDiv
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-[101] bg-red-600 text-white w-full py-3 shadow-2xl flex items-center justify-center gap-3 px-4"
      >
        <PauseIcon className="w-6 h-6 animate-pulse" />
        <span className="font-black text-lg tracking-wide text-center">{t('competition_paused')}</span>
      </MotionDiv>

      {/* Centered Large Icon */}
      <div className="flex-1 flex items-center justify-center relative z-[101] px-4">
        <div className="bg-black/40 p-8 rounded-full border-4 border-red-500/50 backdrop-blur-md flex flex-col items-center gap-4 text-center max-w-xs">
          <PauseIcon className="w-20 h-20 text-red-400" />
          <span className="text-white font-bold text-xl opacity-90">{t('activity_temporarily_stopped')}</span>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="relative z-[101] bg-gradient-to-t from-red-900/80 to-transparent h-24 w-full pointer-events-none" />
    </div>
  );
};

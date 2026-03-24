
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div as any;

interface FrozenOverlayProps {
  isFrozen: boolean;
}

export const FrozenOverlay: React.FC<FrozenOverlayProps> = ({ isFrozen }) => {
  const { t, dir } = useLanguage();
  if (!isFrozen) return null;

  const label = t('competition_paused');
  // Repeat text enough times to fill diagonal ribbon across any screen
  const repeated = Array(12).fill(label).join('   •   ');

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] pointer-events-auto"
      dir={dir}
    >
      {/* Subtle dark backdrop with light blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Diagonal ribbon */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="absolute w-[200%] py-4 bg-black/55 backdrop-blur-sm border-y border-white/15 flex items-center"
          style={{ transform: 'rotate(-25deg)', transformOrigin: 'center' }}
        >
          <div
            className="whitespace-nowrap font-black text-white/80 text-2xl tracking-[0.2em] uppercase select-none animate-[marquee_18s_linear_infinite]"
            style={{ direction: 'ltr' }}
          >
            {repeated}&nbsp;&nbsp;&nbsp;{repeated}
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};


import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ClassRoom } from '../../types';
import { CrownIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div as any;

interface PodiumProps {
  top3Classes: ClassRoom[];
}

export const Podium: React.FC<PodiumProps> = memo(({ top3Classes }) => {
  const { t } = useLanguage();
  const podiumOrder = [top3Classes?.[1], top3Classes?.[0], top3Classes?.[2]].filter(Boolean);
  const smoothSpring = { type: "spring" as const, stiffness: 120, damping: 25, mass: 1 };

  return (
    <div className="flex-1 glass-panel rounded-[var(--radius-container)] p-0 relative flex flex-col shadow-2xl border-white/10 bg-black/20 overflow-hidden h-full min-h-[320px] [isolation:isolate]">
      <h2 className="text-sm font-black text-white flex items-center shrink-0 px-5 h-11 bg-white/5 border-b border-white/5 backdrop-blur-md">
        <div className="p-1.5 bg-yellow-500/10 rounded-[var(--radius-main)] border border-yellow-500/20 ml-3">
          <CrownIcon className="w-3.5 h-3.5 text-yellow-400" />
        </div>
        {t('podium_title')}
      </h2>

      <div className="flex-1 flex items-end justify-center gap-3 md:gap-5 px-3 h-full relative z-10 pb-0 min-h-0 mb-[-2px]">
        {podiumOrder.map((cls, idx) => {
          if (!cls) return null;

          const rank = (cls as any).rank || (idx === 1 ? 1 : idx === 0 ? 2 : 3);

          let height = 'h-[25%]';
          let barStyle = 'bg-gradient-to-b from-orange-600/40 to-transparent border-t-2 border-orange-400/50';
          let badge = (
            <div className="w-7 h-7 rounded-full bg-orange-950/40 border border-orange-400/40 flex items-center justify-center font-bold text-sm text-orange-200 backdrop-blur-md">
              3
            </div>
          );

          if (rank === 1) {
            height = 'h-[55%]';
            barStyle = 'bg-gradient-to-b from-yellow-500/40 to-transparent border-t-2 border-yellow-400/50 shadow-[0_0_50px_rgba(234,179,8,0.1)]';
            badge = (
              <MotionDiv animate={{ y: [-3, 0, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <CrownIcon className="w-10 h-10 md:w-14 md:h-14 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
              </MotionDiv>
            );
          } else if (rank === 2) {
            height = 'h-[35%]';
            barStyle = 'bg-gradient-to-b from-slate-400/40 to-transparent border-t-2 border-slate-300/50';
            badge = (
              <div className="w-7 h-7 rounded-full bg-slate-800/40 border border-slate-300/40 flex items-center justify-center font-bold text-sm text-slate-200 backdrop-blur-md">
                2
              </div>
            );
          }

          return (
            <div key={cls.id || idx} className="flex flex-col items-center justify-end w-1/3 h-full group min-h-0 relative">
              <MotionDiv layout transition={smoothSpring} className="mb-2 text-center z-20 w-full px-0.5">
                <div className={`font-bold text-white leading-tight mb-0.5 drop-shadow-md line-clamp-2 ${rank === 1 ? 'text-base md:text-[clamp(1rem,1.5vw,1.25rem)]' : 'text-[10px] md:text-sm opacity-80'}`}>
                  {cls.name}
                </div>
                <div className={`font-mono font-black tabular-nums ${rank === 1 ? 'text-lg md:text-xl text-yellow-400' : 'text-sm md:text-base text-white/60'}`}>
                  <AnimatedCounter value={cls.score || 0} />
                </div>
              </MotionDiv>
              <MotionDiv layout transition={smoothSpring} className={`w-full ${height} rounded-t-[var(--radius-main)] rounded-b-none relative flex flex-col items-center justify-start pt-3 backdrop-blur-sm ${barStyle} shrink-0`}>
                {badge}
              </MotionDiv>
            </div>
          );
        })}
      </div>
    </div>
  );
});

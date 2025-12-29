
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ClassRoom } from '../../types';
import { LeaderIcon } from './LeaderIcon';
import { CrownIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useLanguage } from '../../hooks/useLanguage';
import { DashboardCardHeader } from './DashboardCardHeader';

const MotionDiv = motion.div as any;

interface PodiumProps {
  top3Classes: ClassRoom[];
}

export const Podium: React.FC<PodiumProps> = memo(({ top3Classes }) => {
  const { t } = useLanguage();
  const podiumOrder = [top3Classes?.[1], top3Classes?.[0], top3Classes?.[2]].filter(Boolean);
  const smoothSpring = { type: "spring" as const, stiffness: 120, damping: 25, mass: 1 };

  return (
    <div className="flex-1 glass-panel rounded-[var(--radius-container)] p-0 relative flex flex-col shadow-[0_25px_50px_rgba(0,0,0,0.7)] border-white/30 bg-black/60 overflow-hidden h-full min-h-[280px] [isolation:isolate]">
      <DashboardCardHeader 
        title={t('podium_title')}
        icon={<CrownIcon className="w-3.5 h-3.5" />}
        iconColorClass="text-yellow-400"
        iconBgClass="bg-yellow-500/10"
        borderColorClass="border-yellow-500/20"
      />

      <div className="flex-1 flex items-end justify-center gap-2.5 md:gap-5 px-3 h-full relative z-10 pb-0 min-h-0 mb-[-2px]">
        {podiumOrder.map((cls, idx) => {
          if (!cls) return null;

          const rank = (cls as any).rank || (idx === 1 ? 1 : idx === 0 ? 2 : 3);

          let height = 'h-[30%]';
          let barStyle = 'bg-gradient-to-b from-orange-600/40 to-transparent border-t-2 border-orange-400/50';
          let badge = (
            <div className="w-8 h-8 rounded-full bg-orange-950/40 border border-orange-400/40 flex items-center justify-center font-bold text-base text-orange-200 backdrop-blur-md">
              3
            </div>
          );

          if (rank === 1) {
            height = 'h-[65%]';
            barStyle = 'bg-gradient-to-b from-yellow-500/40 to-transparent border-t-2 border-yellow-400/50 shadow-[0_0_50px_rgba(234,179,8,0.1)]';
            badge = (
              <div className="animate-float-smooth">
                <LeaderIcon />
              </div>
            );
          } else if (rank === 2) {
            height = 'h-[50%]';
            barStyle = 'bg-gradient-to-b from-slate-400/40 to-transparent border-t-2 border-slate-300/50';
            badge = (
<div className="w-8 h-8 rounded-full bg-slate-800/40 border border-slate-300/40 flex items-center justify-center font-bold text-base text-slate-200 backdrop-blur-md">
              2
            </div>
            );
          }

          return (
            <div key={cls.id || idx} className="flex flex-col items-center justify-end w-1/3 h-full group min-h-0 relative">
              <MotionDiv layout transition={smoothSpring} className="mb-2 text-center z-20 w-full px-1">
                <div className={`font-bold text-white leading-tight mb-0.5 drop-shadow-md line-clamp-2 ${rank === 1 ? 'text-base md:text-[clamp(1rem,1.5vw,1.25rem)]' : 'text-xs md:text-sm opacity-80'}`}>
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

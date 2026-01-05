
import React, { memo, useEffect, useState } from 'react';
import { ClassRoom } from '../../types';
import { TrophyIcon, CompassIcon, FootprintsIcon, MapIcon, TargetIcon, ListIcon } from '../ui/Icons';
import { motion } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { useLanguage } from '../../hooks/useLanguage';
import { DashboardCardHeader } from './DashboardCardHeader';

const MotionDiv = motion.div as any;

interface ClassTickerProps {
  otherClasses: ClassRoom[];
  highlightClassId: string | null;
}

export const ClassTicker: React.FC<ClassTickerProps> = memo(({ otherClasses, highlightClassId }) => {
  const { t } = useLanguage();
  const [tickerContent, setTickerContent] = useState<ClassRoom[]>([]);
  const [duration, setDuration] = useState(40);
  const [isHovered, setIsHovered] = useState(false);

  const CARD_WIDTH = 190;
  const MARGIN_RIGHT = 12;

  // Generate consistent group icon for each class based on their ID
  const getGroupIcon = (cls: ClassRoom) => {
    const hash = cls.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const iconTypes = [CompassIcon, FootprintsIcon, MapIcon, TargetIcon, TrophyIcon];
    const iconIndex = hash % iconTypes.length;
    return iconTypes[iconIndex];
  };

  useEffect(() => {
    if (!otherClasses || otherClasses.length === 0) {
      setTickerContent([]);
      return;
    }

    let baseList = [...otherClasses];
    if (baseList.length < 10) {
      let safetyCounter = 0;
      while (baseList.length < 10 && safetyCounter < 5) {
        baseList = [...baseList, ...otherClasses];
        safetyCounter++;
      }
    }

    const finalList = [...baseList, ...baseList];
    setTickerContent(finalList);

    const totalWidthPx = finalList.length * (CARD_WIDTH + MARGIN_RIGHT);
    const singleCycleWidth = totalWidthPx / 2;
    const speedPxPerSec = 35;

    const calculatedDuration = singleCycleWidth / speedPxPerSec;
    setDuration(isFinite(calculatedDuration) && calculatedDuration > 0 ? calculatedDuration : 40);

  }, [otherClasses]);

  if (!otherClasses || otherClasses.length === 0) return null;

  const renderCard = (cls: ClassRoom, index: number) => {
    if (!cls) return null;

    const uniqueKey = `ticker-${cls.id}-${index}`;
    const isHighlighted = highlightClassId === cls.id;
    const displayRank = (cls as any).rank || '?';

    const currentScore = cls.score || 0;
    const targetScore = cls.target_score || 0;
    const hasTarget = targetScore > 0;
    const progress = hasTarget ? Math.min(100, (currentScore / targetScore) * 100) : 0;
    const isGoalReached = hasTarget && currentScore >= targetScore;

        // Use group-related icon instead of progress-based
        const StatusIcon = getGroupIcon(cls);
    
        let statusColor = 'text-cyan-400';
        let statusBg = 'bg-cyan-500/10';
        let statusBorder = 'border-cyan-500/30';
        let progressBg = 'bg-cyan-500';
    
        if (isGoalReached) {
          statusColor = 'text-emerald-400';
          statusBg = 'bg-emerald-500/20';
          statusBorder = 'border-emerald-500/40';
          progressBg = 'bg-emerald-500';
        } else if (progress > 75) {
          statusColor = 'text-yellow-400';
          statusBg = 'bg-yellow-500/10';
          statusBorder = 'border-yellow-500/30';
          progressBg = 'bg-yellow-500';
        }
    
                        const isBgColor = cls.color && cls.color.startsWith('bg-');
    
                            const bgLayerClass = isHighlighted 
    
                                ? 'bg-white/30' 
    
                                : isBgColor ? cls.color : 'bg-white/10';
    
                            
    
                            // Opacity: 50% transparency for both tags and cards as requested.
    
                            const opacityClass = !isHighlighted && isBgColor ? 'opacity-50 group-hover:opacity-70' : '';
    
                        
    
                            return (
    
                              <div
    
                                key={uniqueKey}
    
                                style={{
    
                              width: CARD_WIDTH,
    
                              marginRight: MARGIN_RIGHT,
    
                              borderColor: isHighlighted ? '#facc15' : undefined
    
                            }}
    
                            className={`flex-shrink-0 rounded-[var(--radius-container)] h-[calc(100%-2rem)] my-1 flex flex-col border relative overflow-hidden backdrop-blur-xl transition-all duration-500 group [isolation:isolate]
    
                                ${isHighlighted
    
                                ? 'scale-[1.05] shadow-[0_0_40px_rgba(255,255,255,0.25)] z-10 border-white/50'
    
                                : 'border-white/20'
    
                              }
    
                              `}
    
                          >
    
                            {/* Background Layer */}
    
                            <div className={`absolute inset-0 transition-opacity duration-300 ${bgLayerClass} ${opacityClass}`} />
    
                    
    
                            {/* Content Wrapper */}
    
                            <div className="relative z-10 flex flex-col h-full">
    
                                {/* Upper Section: Rank + Name + Status Icon */}
    
                                <div className="flex items-center justify-between p-2 pb-0 shrink-0">
    
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-black shrink-0 shadow-lg
    
                                        ${displayRank === 1 ? 'bg-yellow-500 text-slate-950 border-yellow-300' :
    
                                    displayRank === 2 ? 'bg-slate-300 text-slate-900 border-white/50' :
    
                                        displayRank === 3 ? 'bg-orange-500 text-white border-orange-300' :
    
                                        'bg-white/10 text-white border-white/10'}`}>
    
                                    {displayRank}
    
                                </div>
    
                                <h3 className="flex-1 px-1.5 font-black text-white text-sm truncate text-center drop-shadow-md text-outline-sm leading-none">
    
                                    {cls.name}
    
                                </h3>
    
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${statusBg} ${statusBorder} ${statusColor} transition-all duration-500 shadow-lg`}>
    
                                    <StatusIcon className={`w-4 h-4 drop-shadow-md ${!isGoalReached ? 'animate-pulse-soft' : ''}`} />
    
                                </div>
    
                                </div>
    
                    
    
                                {/* Middle Section: Score (larger font) */}
    
                                <div className="flex-1 flex items-center justify-center px-2 py-0">
    
                                <div className="text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] leading-none">
    
                                    <FormattedNumber value={currentScore} />
    
                                </div>
    
                                </div>
    
                    
    
                                {/* Lower Section: Progress Bar + Percentage (conditional) */}
    
                                <div className="shrink-0 relative">
    
                                {hasTarget && targetScore > 0 && (
    
                                    <>
    
                                    <div className="absolute bottom-2 left-2 z-20">
    
                                        <span className={`text-[8px] font-black ${statusColor} bg-black/30 px-1 py-0.5 rounded-[var(--radius-main)] backdrop-blur-sm border border-white/5 text-outline-sm`}>
    
                                        {Math.round(progress)}%
    
                                        </span>
    
                                    </div>
    
                                    <div className="w-full h-1 bg-white/5 overflow-hidden">
    
                                        <MotionDiv
    
                                        className={`h-full ${progressBg} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
    
                                        initial={{ width: 0 }}
    
                                        animate={{ width: `${progress}%` }}
    
                                        transition={{ duration: 1.5, ease: "easeOut" }}
    
                                        />
    
                                    </div>
    
                                    </>
    
                                )}
    
                                </div>
    
                            </div>
    
                            <div className={`absolute inset-0 opacity-5 pointer-events-none ${progressBg} rounded-[var(--radius-container)]`} />
    
                          </div>
    
                        );
  };

  return (
    <div
      className="h-full min-h-[144px] w-full glass-panel rounded-[var(--radius-container)] flex flex-col overflow-hidden relative shadow-2xl border-white/20 bg-slate-900/60"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={t('tab_my_class')}
      aria-live="polite"
      aria-atomic="false"
    >
      <DashboardCardHeader
        title={t('tab_my_class')}
        icon={<ListIcon className="w-3.5 h-3.5" />}
        iconColorClass="text-blue-400"
        iconBgClass="bg-blue-500/10"
        borderColorClass="border-blue-500/30"
      />

      <div className="flex-1 flex items-center overflow-hidden relative w-full mask-gradient">
        <div
          className="flex items-center absolute left-0 animate-scroll-horizontal-reverse will-change-transform h-full pl-4"
          style={{
            animationDuration: `${Math.max(20, duration)}s`,
            width: 'max-content',
            transform: 'translateZ(0)',
            animationPlayState: isHovered ? 'paused' : 'running'
          }}
        >
          {tickerContent.map((cls, idx) => renderCard(cls, idx))}
        </div>
      </div>
    </div>
  );
});

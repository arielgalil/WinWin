
import React, { memo, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ClassRoom } from '../../types';
import { TrophyIcon, CompassIcon, FootprintsIcon, MapIcon, TargetIcon, ListIcon } from '../ui/Icons';
import { motion } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { useLanguage } from '../../hooks/useLanguage';
import { useAnimatedScore } from '../../hooks/useAnimatedScore';
import { DashboardCardHeader } from './DashboardCardHeader';
import { getRankBadgeClasses } from '../../utils/rankingUtils';

const MotionDiv = motion.div as any;

/** Wraps FormattedNumber with smooth count-up animation when score changes. */
const AnimatedScore: React.FC<{ value: number }> = ({ value }) => {
    const animated = useAnimatedScore(value);
    return <FormattedNumber value={animated} />;
};

interface ClassTickerProps {
  otherClasses: ClassRoom[];
  highlightClassId: string | null;
}

export const ClassTicker: React.FC<ClassTickerProps> = memo(({ otherClasses, highlightClassId }) => {
  const { t } = useLanguage();
  const [tickerContent, setTickerContent] = useState<ClassRoom[]>([]);

  // Computed once on mount — kiosk screens don't resize mid-session
  const CARD_WIDTH = useMemo(() => Math.max(190, Math.min(300, Math.round(window.innerWidth * 0.145))), []);
  const MARGIN_RIGHT = useMemo(() => Math.max(12, Math.min(20, Math.round(window.innerWidth * 0.008))), []);
  const SPEED_PX_PER_SEC = useMemo(() => Math.max(35, Math.min(80, Math.round(window.innerWidth * 0.04))), []);

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const singleCycleWidthRef = useRef(0);
  const positionRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Drag refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragBasePositionRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const animate = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    if (!isPausedRef.current && !isDraggingRef.current) {
      const cycleWidth = singleCycleWidthRef.current;
      if (cycleWidth > 0) {
        positionRef.current -= SPEED_PX_PER_SEC * dt;
        if (positionRef.current <= -cycleWidth) {
          positionRef.current += cycleWidth;
        }
      }
    }

    if (scrollRef.current) {
      scrollRef.current.style.transform = `translateX(${positionRef.current}px) translateZ(0)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const handlePointerEnter = () => {
    isPausedRef.current = true;
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
      hoverTimeoutRef.current = null;
    }, 3000);
  };

  const handlePointerLeave = () => {
    isPausedRef.current = false;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Generate consistent group icon for each class based on their ID
  const getGroupIcon = (cls: ClassRoom) => {
    const hash = cls.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const iconTypes = [CompassIcon, FootprintsIcon, MapIcon, TargetIcon, TrophyIcon];
    const iconIndex = hash % iconTypes.length;
    return iconTypes[iconIndex];
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!otherClasses || otherClasses.length === 0) {
      setTickerContent([]);
      return;
    }

    const classesWithScore = otherClasses.filter(c => (c.score || 0) > 0);
    const sourceList = classesWithScore.length >= 3 ? classesWithScore : otherClasses;

    // Sort alphabetically (א"ב)
    let baseList = [...sourceList].sort((a, b) => a.name.localeCompare(b.name, 'he'));
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
    singleCycleWidthRef.current = totalWidthPx / 2;

  }, [otherClasses]);

  useEffect(() => {
    if (tickerContent.length === 0) return;
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tickerContent, animate]);

  if (!otherClasses || otherClasses.length === 0) return null;

  const startDrag = (clientX: number) => {
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragBasePositionRef.current = positionRef.current;
    setIsDragging(true);
  };

  const moveDrag = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientX - dragStartXRef.current;
    positionRef.current = dragBasePositionRef.current + delta;
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    lastTimeRef.current = null; // reset dt to avoid jump
    setIsDragging(false);
  };

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
        let progressBg = 'bg-cyan-500';

        if (isGoalReached) {
          statusColor = 'text-emerald-400';
          progressBg = 'bg-emerald-500';
        } else if (progress > 75) {
          statusColor = 'text-yellow-400';
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
    
                            className={`flex-shrink-0 rounded-[var(--radius-container)] h-[calc(100%-2rem)] my-1 flex flex-col border relative overflow-hidden transition-[border-color,box-shadow,transform] duration-500 group [isolation:isolate]
    
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

                                {/* Centered group: rank+name+icon + score */}
                                <div className="flex-1 flex flex-col justify-center gap-0.5 px-2">

                                {/* Upper Section: Rank + Name + Status Icon */}

                                <div className="flex items-center justify-between shrink-0">
    
                                <div className={`w-[clamp(1.75rem,3vh,2.75rem)] h-[clamp(1.75rem,3vh,2.75rem)] rounded-full flex items-center justify-center border text-[clamp(0.65rem,1vw,1rem)] font-black shrink-0 shadow-lg ${getRankBadgeClasses(displayRank as number)}`}>
    
                                    {displayRank}
    
                                </div>
    
                                <h3 className="flex-1 px-1.5 font-black text-white text-base truncate text-center drop-shadow-md text-outline-md leading-none">
    
                                    {cls.name}
    
                                </h3>
    
                                <div className={`w-[clamp(1.75rem,3vh,2.75rem)] h-[clamp(1.75rem,3vh,2.75rem)] rounded-full flex items-center justify-center border bg-amber-500 border-amber-300 ${statusColor} transition-all duration-500 shadow-lg`}>

                                    <StatusIcon className={`w-[clamp(0.9rem,1.3vh,1.3rem)] h-[clamp(0.9rem,1.3vh,1.3rem)] drop-shadow-md ${!isGoalReached ? 'animate-pulse-soft' : ''}`} />
    
                                </div>
    
                                </div>
    
                    
    
                                {/* Middle Section: Score (larger font) */}

                                <div className="flex items-center justify-center">

                                <div className="text-[clamp(1.1rem,2.2vh,2.2rem)] font-black text-white tracking-tighter tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] leading-none">

                                    <AnimatedScore value={currentScore} />

                                </div>

                                </div>

                                </div>{/* end centered group */}

                                {/* Lower Section: Progress Bar + Percentage (conditional) */}

                                <div className="shrink-0 relative">
    
                                {hasTarget && targetScore > 0 && (
    
                                    <>
    
                                    <div className="absolute bottom-2 left-2 z-20">
    
                                        <span className={`text-[8px] font-black ${statusColor} bg-black/30 px-1 py-0.5 rounded-[var(--radius-main)] backdrop-blur-sm border border-white/5 text-outline-sm`}>
    
                                        {Math.round(progress)}%
    
                                        </span>
    
                                    </div>
    
                                    <div className="w-full h-1 bg-white/15 overflow-hidden rounded-full">
    
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
      style={{ maskImage: 'none', WebkitMaskImage: 'none' }}
    className="h-full w-full glass-panel rounded-[var(--radius-container)] flex flex-col overflow-hidden relative shadow-2xl border-white/20 bg-slate-900/60"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={() => {
        if (isPausedRef.current) {
          if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = window.setTimeout(() => {
            isPausedRef.current = false;
            hoverTimeoutRef.current = null;
          }, 3000);
        }
      }}
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

      <div
        className="flex-1 flex items-center overflow-hidden relative w-full mask-gradient"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          startDrag(e.clientX);
        }}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={scrollRef}
          className="flex items-center absolute left-0 will-change-transform h-full pl-4"
          style={{ width: 'max-content' }}
        >
          {tickerContent.map((cls, idx) => renderCard(cls, idx))}
        </div>
      </div>
    </div>
  );
});

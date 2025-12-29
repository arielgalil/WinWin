
import React from 'react';
import { AppSettings, ClassRoom, Student } from '../../types';
import { TrophyIcon, CrownIcon, MedalIcon } from '../ui/Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { LeaderIcon } from './LeaderIcon';

interface ShareableLeaderboardProps {
    id: string;
    settings: AppSettings;
    topClasses: ClassRoom[];
    top10Students: (Student & { rank: number, className: string })[];
}

export const ShareableLeaderboard: React.FC<ShareableLeaderboardProps> = ({
    id,
    settings,
    topClasses = [],
    top10Students = []
}) => {
    const { t, dir, lang } = useLanguage();
    // Safe classes array logic to prevent crashes if array is empty
    const safeClasses: ClassRoom[] = [...(topClasses || [])];
    while (safeClasses.length < 3) {
        safeClasses.push({
            id: `placeholder-${safeClasses.length}`,
            name: '-',
            score: 0,
            color: '',
            students: []
        });
    }

    // Podium Order: 2nd, 1st, 3rd (Standard podium layout)
    const podiumOrder = [safeClasses[1], safeClasses[0], safeClasses[2]];

    // Determine Custom Header Style (SIMPLIFIED FOR HTML2CANVAS STABILITY)
    const headerStyle = React.useMemo(() => {
        const textColor = settings?.header_text_color_1 || '#ffffff';

        return {
            color: textColor,
            textShadow: '0 4px 12px rgba(0,0,0,0.6)',
            zIndex: 50
        };
    }, [settings?.header_text_color_1]);

    return (
        <div
            id={id}
            style={{
                width: '1080px', // Fixed Width for Full HD capture
                height: '1440px', // Fixed Height (3:4 Ratio)
                position: 'fixed',
                top: 0,
                left: '-10000px', // Hidden off-screen
                zIndex: -1,
                background: '#0f172a',
                backgroundImage: `
            radial-gradient(circle at 20% 20%, ${settings?.primary_color || '#4c1d95'} 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${settings?.secondary_color || '#0f172a'} 0%, transparent 50%)
        `,
                backgroundSize: '120% 120%',
                fontFamily: 'Heebo, sans-serif',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                direction: dir,
                overflow: 'hidden'
            }}
        >
            {/* --- Header --- */}
            <div className="flex items-center justify-between px-12 py-8 bg-black/20 backdrop-blur-md border-b border-white/10 relative z-20">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {/* Logo Glow */}
                        <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full"></div>
                        {settings?.logo_url ? (
                            <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-full p-3 border-2 border-white/20 relative z-10 shadow-lg">
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center relative z-10 border-2 border-yellow-500/50">
                                <TrophyIcon className="w-12 h-12 text-yellow-500" />
                            </div>
                        )}
                    </div>
                    <div className="relative z-30">
                        <h1
                            className="text-5xl font-black mb-2 leading-tight"
                            style={headerStyle}
                        >
                            {settings?.competition_name || t('competition_label')}
                        </h1>
                        <p className="text-3xl text-blue-200 font-bold tracking-wide opacity-90 drop-shadow-md">{settings?.school_name || ''}</p>
                    </div>
                </div>
                <div className="text-center bg-black/30 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm relative z-20">
                    <div className="text-slate-400 font-bold text-lg uppercase tracking-widest mb-1">{t('last_update')}</div>
                    <div className="text-white font-mono text-2xl font-bold" dir="ltr">{new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}</div>
                </div>
            </div>

            <div className="flex-1 p-10 flex flex-col gap-8 z-10">

                {/* --- PODIUM SECTION --- */}
                <div className="bg-black/20 backdrop-filter backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-[480px]">

                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3 relative z-10 drop-shadow-md">
                        <CrownIcon className="w-8 h-8 text-yellow-400" />
                        {t('groups_podium')}
                    </h2>

                    <div className="flex-1 flex items-end justify-center gap-12 px-12 pb-0 relative z-10">
                        {podiumOrder.map((cls, idx) => {
                            if (!cls) return null; // Safety check

                            const isFirst = idx === 1; // In array [2nd, 1st, 3rd], index 1 is First Place

                            let height = '45%';
                            // Silver (Default for idx 0)
                            let barStyle = 'bg-gradient-to-b from-slate-400/60 to-slate-800/10 border-t-4 border-slate-300';
                            let rankBadge = <div className="text-3xl font-black text-slate-200 mb-2">#2</div>;

                            if (isFirst) {
                                height = '85%';
                                // Gold
                                barStyle = 'bg-gradient-to-b from-yellow-500/60 to-yellow-900/10 border-t-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.2)]';
                                rankBadge = (
                                    <div className="mb-3">
                                        <LeaderIcon animated={false} size="lg" />
                                    </div>
                                );
                            } else if (idx === 2) { // 3rd Place
                                height = '35%';
                                // Bronze
                                barStyle = 'bg-gradient-to-b from-orange-600/60 to-orange-900/10 border-t-4 border-orange-500';
                                rankBadge = <div className="text-3xl font-black text-orange-200 mb-2">#3</div>;
                            }

                            return (
                                <div key={idx} className="flex flex-col items-center justify-end w-1/3 h-full group">

                                    {/* Text Container */}
                                    <div className={`text-center w-full flex flex-col items-center z-20 transition-transform ${isFirst ? 'mb-4' : 'mb-3'}`}>
                                        <div className={`font-black text-white leading-tight truncate w-full px-2 drop-shadow-lg
                                  ${isFirst ? 'text-4xl mb-2' : 'text-2xl mb-1 text-slate-200'}`}>
                                            {cls.name || '-'}
                                        </div>
                                        <div className={`font-mono font-bold text-white/90 tabular-nums
                                  ${isFirst ? 'text-4xl text-yellow-200' : 'text-2xl text-slate-400'}`}>
                                            {(cls.score || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* The Bar */}
                                    <div className={`w-full rounded-t-[var(--radius-main)] rounded-b-none flex flex-col items-center justify-end relative backdrop-blur-sm ${barStyle}`} style={{ height }}>
                                        {rankBadge}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- LEADERBOARD SECTION --- */}
                <div className="bg-black/20 backdrop-filter backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex-1 flex flex-col overflow-hidden">
                    <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-4 drop-shadow-md border-b border-white/10 pb-4">
                        <MedalIcon className="w-8 h-8 text-pink-400" />
                        {t('top_10_students')}
                    </h2>

                    <div className="flex-1 grid grid-cols-2 grid-rows-5 grid-flow-col gap-x-12 gap-y-4 content-start">
                        {(top10Students || []).slice(0, 10).map((student, idx) => (
                            <div
                                key={student.id || idx}
                                className={`flex items-center px-4 py-2 rounded-xl border-b border-white/5 relative
                        ${idx === 0
                                        ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-l-4 border-l-yellow-400'
                                        : idx < 3 ? 'bg-white/5' : ''}`}
                            >
                                {/* Rank */}
                                <div className={`text-2xl font-black w-10 shrink-0 text-center
                            ${idx === 0 ? 'text-yellow-400' :
                                        idx === 1 ? 'text-slate-300' :
                                            idx === 2 ? 'text-orange-400' :
                                                'text-slate-500'}`}>
                                    {student.rank}
                                </div>

                                {/* Name & Class (Inline) */}
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className={`font-bold text-white whitespace-normal break-words leading-snug ${idx === 0 ? 'text-3xl' : 'text-2xl'}`}>
                                        {student.name}
                                        <span className="mr-3 text-slate-400 font-medium text-xl opacity-80 inline-block">
                                            ({student.className || ''})
                                        </span>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className={`font-black tracking-tight tabular-nums
                             ${idx === 0 ? 'text-4xl text-yellow-300' : 'text-3xl text-blue-200'}`}>
                                    {(student.score || 0).toLocaleString()}
                                </div>
                            </div>
                        ))}

                        {(!top10Students || top10Students.length === 0) && (
                            <div className="col-span-2 text-center text-slate-500 text-3xl font-bold opacity-50 mt-20">
                                {t('no_data')}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* --- Footer --- */}
            <div className="py-4 text-center bg-black/40 backdrop-blur-xl border-t border-white/10 relative z-20">
                {/* Clean Footer - Text Removed */}
            </div>
        </div>
    );
};

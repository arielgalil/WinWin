
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Campaign, UserProfile } from '../types';
import {
    RefreshIcon,
    LockIcon,
    SproutIcon,
    AwardIcon,
    SettingsIcon,
    ArrowRightIcon,
    AlertIcon
} from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { FormattedNumber } from './ui/FormattedNumber';
import { Logo } from './ui/Logo';
import { useLanguage } from '../hooks/useLanguage';
import { VersionFooter } from './ui/VersionFooter';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface ExtendedCampaign extends Campaign {
    school_name?: string;
    total_score?: number;
    logo_url?: string;
}

interface CampaignSelectorProps {
    user?: UserProfile | null;
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({ user }) => {
    const { t, dir } = useLanguage();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<ExtendedCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        setFetchError(null);
        console.log("[CAMPAIGN-SELECTOR] Fetch started...");

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    *,
                    app_settings (school_name, logo_url),
                    classes (score)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("[CAMPAIGN-SELECTOR] Database error:", error);
                throw error;
            }

            const processed: ExtendedCampaign[] = (data || []).map(camp => {
                const settings = Array.isArray(camp.app_settings) ? camp.app_settings[0] : camp.app_settings;
                const classes = Array.isArray(camp.classes) ? camp.classes : [];

                return {
                    ...camp,
                    school_name: settings?.school_name || t('educational_institution'),
                    logo_url: settings?.logo_url || camp.logo_url,
                    total_score: classes.reduce((sum: number, cls: any) => sum + (cls.score || 0), 0)
                };
            });

            setCampaigns(processed);
        } catch (err: any) {
            console.error("[CAMPAIGN-SELECTOR] Fatal fetch error:", err);
            setFetchError(err.message || t('database_connection_error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [user?.id]);

    return (
        <div className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative" dir={dir}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-primary/5 to-accent/5"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 md:px-8 md:pt-12 flex-1 pb-0 rtl:text-right ltr:text-left">
                <div className="flex flex-row items-center justify-start gap-5 md:gap-8 mb-12">
                    <MotionDiv initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 md:w-28 md:h-28 bg-[#f8fafc] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary border-4 border-slate-200 shrink-0 overflow-hidden relative no-select no-drag">
                        <div className="absolute inset-0 bg-primary/5" />
                        <SproutIcon className="w-12 h-12 md:w-16 md:h-16 relative z-10" />
                    </MotionDiv>

                    <div className="flex flex-col gap-0.5">
                        <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                            {t('login_platform_title', { app_name: '___' }).split('___').map((part, i) => (
                                <React.Fragment key={i}>
                                    {part}
                                    {i === 0 && <span className="text-primary">{t('matzmicha')}</span>}
                                </React.Fragment>
                            ))}
                        </MotionDiv>
                        <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col text-muted-foreground text-sm md:text-lg font-bold leading-tight max-w-2xl">
                            <span>{t('login_platform_desc')}</span>
                        </MotionDiv>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <MotionDiv key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-32 gap-6">
                            <RefreshIcon className="w-14 h-14 text-primary animate-spin" />
                            <span className="text-muted-foreground font-black text-xs tracking-widest uppercase">{t('connecting_to_db')}</span>
                        </MotionDiv>
                    ) : fetchError ? (
                        <MotionDiv key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-red-500/10 rounded-[var(--radius-container)] border border-red-500/20 max-w-xl mx-auto shadow-2xl px-8">
                            <AlertIcon className="w-16 h-16 text-red-600 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-red-600 mb-3">{t('data_load_error')}</h3>
                            <button onClick={fetchCampaigns} className="bg-red-600 text-white px-8 py-4 rounded-[var(--radius-main)] font-black flex items-center justify-center gap-3 mx-auto transition-all active:scale-95 shadow-lg">
                                <RefreshIcon className="w-5 h-5" /> {t('retry')}
                            </button>
                        </MotionDiv>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campaigns.map(camp => (
                                <MotionDiv
                                    key={camp.id}
                                    whileHover={{ y: -8 }}
                                    className="group relative flex flex-col bg-card rounded-[var(--radius-container)] p-6 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-border overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/comp/${camp.slug}`)}
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Logo src={camp.logo_url} className="w-16 h-16 shadow-md group-hover:scale-105 transition-transform duration-500" fallbackIcon="school" />
                                            <div className="rtl:text-right ltr:text-left min-w-0">
                                                <h3 className="text-xl font-black text-foreground leading-tight truncate group-hover:text-primary transition-colors uppercase">{camp.name}</h3>
                                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-wider truncate">{camp.school_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-left flex flex-col items-end">
                                            <div className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                                                <FormattedNumber value={camp.total_score || 0} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-auto">
                                        <button className="w-full py-4 rounded-[var(--radius-main)] bg-primary hover:opacity-90 text-primary-foreground transition-all flex items-center justify-center gap-3 font-black shadow-lg">
                                            {t('enter_board')} <ArrowRightIcon className="w-4 h-4 rtl:rotate-180 ltr:rotate-0" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => navigate(`/vote/${camp.slug}`, { state: { campaign: camp } })} className="py-3 rounded-[var(--radius-main)] bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[11px] flex items-center justify-center gap-2 transition-colors border border-primary/10">
                                                <AwardIcon className="w-4 h-4" /> {t('enter_points')}
                                            </button>
                                            <button onClick={() => navigate(`/admin/${camp.slug}`, { state: { campaign: camp } })} className="py-3 rounded-[var(--radius-main)] bg-accent/10 text-accent-foreground hover:bg-accent/20 font-bold text-[11px] flex items-center justify-center gap-2 transition-colors border border-accent/10">
                                                <SettingsIcon className="w-4 h-4" /> {t('manage')}
                                            </button>
                                        </div>
                                    </div>

                                    {!camp.is_active && (
                                        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 gap-3">
                                            <LockIcon className="w-10 h-10 text-muted-foreground/40" />
                                            <span className="font-black text-muted-foreground text-lg">{t('competition_paused')}</span>
                                        </div>
                                    )}
                                </MotionDiv>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </main>
            <VersionFooter />
        </div>
    );
};

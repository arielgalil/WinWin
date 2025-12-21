
import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { LockIcon, SchoolIcon, ArrowRightIcon, SproutIcon } from '../ui/Icons';
import { GradientBackground } from '../ui/GradientBackground';
import { AppSettings } from '../../types';
import { motion } from 'framer-motion';
import { Logo } from '../ui/Logo';

const MotionDiv = motion.div as any;

interface LiteLoginProps {
  onLogin: (email: string, pass: string, remember: boolean) => Promise<boolean>;
  loading: boolean;
  error?: string;
  savedEmail?: string;
  settings?: AppSettings;
  onBack?: () => void;
}

export const LiteLogin: React.FC<LiteLoginProps> = ({ onLogin, loading, error, savedEmail, settings, onBack }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState(savedEmail || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password, rememberMe);
  };

  // Branding Logic
  const hasBranding = !!settings && settings.school_name && !settings.school_name.includes('טוען');
  const logoUrl = settings?.logo_url;
  const primaryColor = settings?.primary_color || '#3b82f6';
  const secondaryColor = settings?.secondary_color || '#1e293b';

  return (
    <GradientBackground
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      brightness={Math.max(60, settings?.background_brightness ?? 60)}
    >
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-lg bg-white/10 backdrop-blur-3xl rounded-[var(--radius-container)] p-5 md:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col gap-5 rtl:text-right ltr:text-left"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}44 100%)`,
            backdropFilter: 'blur(40px) saturate(150%)'
          }}
        >
          {/* Header Section - Horizontal Layout */}
          <div className="flex items-center gap-5 flex-row text-center px-2">
            {/* Standardized Circular Logo */}
            <Logo
              src={logoUrl}
              className={`w-20 h-20 md:w-24 md:h-24 shadow-xl backdrop-blur-md shrink-0 transition-all duration-700 ${hasBranding ? 'scale-105' : ''}`}
              fallbackIcon="trophy"
            />

            {/* Text Content */}
            <div className="flex-1 flex flex-col gap-1 text-right rtl:text-right ltr:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                {t('login_platform_title', { app_name: '___' }).split('___').map((part, i) => (
                  <React.Fragment key={i}>
                    {part}
                    {i === 0 && <span className="text-emerald-400">{t('matzmicha')}</span>}
                  </React.Fragment>
                ))}
              </h1>
              <p className="text-white/80 text-sm md:text-base font-bold leading-relaxed">
                {t('login_platform_desc')}
                <span className="block text-emerald-300/90 text-xs md:text-sm mt-1 font-black">{t('login_platform_slogan')}</span>
              </p>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="space-y-1">
              <label className="block text-white text-[10px] font-black uppercase tracking-widest mx-2 opacity-70">{t('email_label')}</label>
              <input
                type="email"
                placeholder="teacher@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-[var(--radius-main)] px-5 py-3 text-white text-lg rtl:text-right ltr:text-left focus:border-white/40 focus:bg-black/40 outline-none transition-all placeholder:text-white/20 shadow-inner"
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-white text-[10px] font-black uppercase tracking-widest mx-2 opacity-70">{t('password_label')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-[var(--radius-main)] px-5 py-3 text-white text-lg rtl:text-right ltr:text-left focus:border-white/40 focus:bg-black/40 outline-none transition-all placeholder:text-white/20 shadow-inner"
                required
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-3 mx-1">
              <input
                type="checkbox"
                id="lite-remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-[var(--radius-main)] bg-black/30 border-white/20 accent-white cursor-pointer"
              />
              <label htmlFor="lite-remember" className="text-white text-xs font-bold cursor-pointer select-none">{t('remember_me')}</label>
            </div>

            {error && (
              <div className="bg-red-500/30 border border-red-500/50 p-3 rounded-[var(--radius-main)] text-white text-[11px] text-center font-black animate-in fade-in slide-in-from-top-2">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] font-black text-lg py-3.5 rounded-[var(--radius-main)] transition-all shadow-xl flex items-center justify-center gap-3 mt-2 border border-white/50"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                  <span>{t('connecting')}</span>
                </div>
              ) : (
                <>
                  <LockIcon className="w-5 h-5" />
                  <span>{t('login_button')}</span>
                </>
              )}
            </button>
          </form>
        </MotionDiv>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 flex items-center gap-3 text-white/70 hover:text-white transition-all text-sm font-black bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-full border border-white/10 shadow-lg active:scale-95 group"
          >
            <ArrowRightIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-0 ltr:rotate-180" />
            {t('back_to_campaigns')}
          </button>
        )}
      </div>
    </GradientBackground>
  );
};

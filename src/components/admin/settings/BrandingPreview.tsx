import React from 'react';
import { GradientBackground } from '../../ui/GradientBackground';
import { useLanguage } from '../../../hooks/useLanguage';

interface BrandingPreviewProps {
    primaryColor: string;
    secondaryColor: string;
    brightness: number;
    title: string;
    subtitle?: string;
    textColor1?: string;
    textColor2?: string;
}

export const BrandingPreview: React.FC<BrandingPreviewProps> = ({
    primaryColor,
    secondaryColor,
    brightness,
    title,
    subtitle,
    textColor1 = '#ffffff',
    textColor2 = '#ffffff'
}) => {
    const { t } = useLanguage();

    return (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[var(--border-main)] shadow-lg group">
            {/* Real Background logic */}
            <GradientBackground 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor} 
                brightness={brightness}
                className="!absolute"
                fixed={false}
            >
                <div className="flex flex-col items-center justify-center h-full p-4 relative z-10">
                    <div className="bg-black/40 backdrop-blur-xl p-5 rounded-xl border border-white/10 shadow-2xl flex flex-col items-center gap-1 max-w-[85%]">
                        <h3 
                            className="font-black text-lg md:text-xl text-center drop-shadow-lg uppercase tracking-tight leading-tight"
                            style={{ color: textColor1 }}
                        >
                            {title || t('sample_title' as any)}
                        </h3>
                        <p 
                            className="font-bold text-sm tracking-tight opacity-90"
                            style={{ color: textColor2 }}
                        >
                            {subtitle || t('educational_institution')}
                        </p>
                        <div className="h-0.5 w-10 bg-white/20 rounded-full mt-2" />
                        <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-1">{t('preview' as any)}</span>
                    </div>
                </div>
            </GradientBackground>
            
            {/* Status indicators */}
            <div className="absolute top-3 right-3 flex gap-2 z-20">
                <div className="w-4 h-4 rounded-full border border-white/40 shadow-md" style={{ backgroundColor: primaryColor }} title="Primary Color" />
                <div className="w-4 h-4 rounded-full border border-white/40 shadow-md" style={{ backgroundColor: secondaryColor }} title="Secondary Color" />
            </div>
        </div>
    );
};

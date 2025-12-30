import React from 'react';
import { GradientBackground } from '../../ui/GradientBackground';
import { useLanguage } from '../../../hooks/useLanguage';

interface BrandingPreviewProps {
    primaryColor: string;
    secondaryColor: string;
    brightness: number;
    title: string;
}

export const BrandingPreview: React.FC<BrandingPreviewProps> = ({
    primaryColor,
    secondaryColor,
    brightness,
    title
}) => {
    const { t } = useLanguage();

    return (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[var(--border-main)] shadow-lg group">
            {/* Real Background logic */}
            <GradientBackground 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor} 
                brightness={brightness}
                className="!absolute"
            >
                <div className="flex flex-col items-center justify-center h-full p-4 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl flex flex-col items-center gap-2 max-w-[80%]">
                        <h3 className="text-white font-black text-xl text-center drop-shadow-lg uppercase tracking-tight">
                            {title || t('sample_title' as any)}
                        </h3>
                        <div className="h-1 w-12 bg-white/40 rounded-full" />
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{t('preview' as any)}</span>
                    </div>
                </div>
            </GradientBackground>
            
            {/* Status indicators */}
            <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }} title="Primary" />
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: secondaryColor }} title="Secondary" />
            </div>
        </div>
    );
};

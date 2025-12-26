import React from 'react';
import { SproutIcon, HomeIcon, TrophyIcon, CalculatorIcon, SettingsIcon, Volume2Icon, VolumeXIcon, ZapIcon, CrownIcon, ShieldAlertIcon, LockIcon } from './Icons';

interface NavigationButtonProps {
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
    isActive?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-12 h-12 min-w-[44px] min-h-[44px]',
    md: 'w-14 h-14 min-w-[44px] min-h-[44px]',
    lg: 'w-16 h-16 min-w-[44px] min-h-[44px]'
};

const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
};

export const NavigationButton: React.FC<NavigationButtonProps> = ({
    onClick,
    title,
    icon,
    isActive = false,
    size = 'md',
    className = ''
}) => {
    const baseClasses = `
        flex items-center justify-center shrink-0 outline-none focus:outline-none focus:ring-0
        hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]
        transition-all duration-300 hover:text-white/100
    `;

    const stateClasses = isActive
        ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100'
        : 'text-white/60 opacity-80';

    const style = {
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`${baseClasses} ${stateClasses} ${sizeClasses[size]} ${className}`}
            style={style}
        >
            <div className={iconSizes[size]}>
                {icon}
            </div>
        </button>
    );
};

// Icon-specific components for cleaner usage
export const HomeButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<SproutIcon />} />
);

export const TrophyButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<TrophyIcon />} />
);

export const CalculatorButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<CalculatorIcon />} />
);

export const SettingsButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<SettingsIcon />} />
);

export const MusicButton = ({ isPlaying, ...props }: { isPlaying: boolean } & Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={isPlaying ? <Volume2Icon /> : <VolumeXIcon />} />
);

export const ZapButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<ZapIcon />} />
);

export const CrownButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<CrownIcon />} />
);

export const ShieldButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<ShieldAlertIcon />} />
);

export const LockButton = (props: Omit<NavigationButtonProps, 'icon'>) => (
    <NavigationButton {...props} icon={<LockIcon />} />
);
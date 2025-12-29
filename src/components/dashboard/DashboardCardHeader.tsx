import React from 'react';

interface DashboardCardHeaderProps {
    title: string;
    icon: React.ReactNode;
    iconColorClass?: string;
    iconBgClass?: string;
    borderColorClass?: string;
    rightContent?: React.ReactNode;
}

export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = ({
    title,
    icon,
    iconColorClass = 'text-white',
    iconBgClass = 'bg-white/10',
    borderColorClass = 'border-white/20',
    rightContent
}) => {
    return (
        <div className="flex justify-between items-center shrink-0 px-5 h-11 bg-white/20 border-b border-white/20 backdrop-blur-md">
            <h2 className="text-sm font-black text-white flex items-center min-w-0">
                <div className={`w-7 h-7 rounded-full border ml-3 flex items-center justify-center shrink-0 ${iconBgClass} ${borderColorClass}`}>
                    {/* Clone the icon to ensure it gets specific sizing if needed, or rely on parent sizing */}
                    <div className={`${iconColorClass} flex items-center justify-center`}>
                        {icon}
                    </div>
                </div>
                <span className="truncate uppercase tracking-tight leading-none pt-0.5">{title}</span>
            </h2>
            {rightContent && (
                <div className="flex items-center gap-1">
                    {rightContent}
                </div>
            )}
        </div>
    );
};

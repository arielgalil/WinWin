import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    colorClass = 'bg-primary/10',
    className,
}) => {
    return (
        <div
            className={cn(
                'flex items-center gap-4 px-5 py-4 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-card)] transition-all hover:shadow-lg hover:border-[var(--accent-blue)]/30',
                className
            )}
        >
            <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', colorClass)}>
                {icon}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none mb-1.5">
                    {label}
                </span>
                <span className="text-2xl font-black text-[var(--text-main)] leading-none tabular-nums">
                    {value}
                </span>
            </div>
        </div>
    );
};

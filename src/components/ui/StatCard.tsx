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
                'flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 rounded-[var(--radius-main)] border flex-1 border-border bg-card transition-colors hover:shadow-md',
                className
            )}
        >
            <div className={cn('p-1.5 md:p-2 rounded-[calc(var(--radius-main)*0.5)]', colorClass)}>
                {icon}
            </div>
            <div className="flex flex-col leading-none text-center md:text-right">
                <span className="text-[10px] font-bold uppercase opacity-60 text-muted-foreground">
                    {label}
                </span>
                <span className="text-sm md:text-lg font-black text-foreground">
                    {value}
                </span>
            </div>
        </div>
    );
};

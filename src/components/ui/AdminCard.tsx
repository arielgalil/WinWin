import React from 'react';
import { cn } from '@/lib/utils';

interface AdminCardProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({
    title,
    description,
    icon,
    actions,
    children,
    className,
    headerClassName,
    bodyClassName,
}) => {
    return (
        <div
            className={cn(
                'bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-container)] overflow-hidden shadow-lg transition-all hover:shadow-xl',
                className
            )}
        >
            {(title || description || icon || actions) && (
                <div
                    className={cn(
                        'p-5 flex justify-between items-center border-b border-[var(--border-main)] bg-[var(--bg-surface)]',
                        headerClassName
                    )}
                >
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-page)] flex items-center justify-center shadow-md border border-[var(--border-main)] shrink-0">
                                {icon}
                            </div>
                        )}
                        {(title || description) && (
                            <div>
                                {title && (
                                    <h3 className="font-black text-xl text-[var(--text-main)] leading-none">
                                        {title}
                                    </h3>
                                )}
                                {description && (
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {actions && <div className="flex gap-2 items-center">{actions}</div>}
                </div>
            )}
            <div className={cn('p-5', bodyClassName)}>{children}</div>
        </div>
    );
};

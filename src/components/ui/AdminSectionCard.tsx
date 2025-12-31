import React from 'react';

interface AdminSectionCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    rightAction?: React.ReactNode;
    className?: string;
}

export const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
    title,
    description,
    icon,
    children,
    rightAction,
    className = ""
}) => {
    return (
        <div className={`bg-[var(--bg-card)] p-6 sm:p-8 rounded-[var(--radius-container)] border border-[var(--border-main)] shadow-sm space-y-8 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-[var(--radius-main)] border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-h2 text-[var(--text-main)] leading-none">{title}</h3>
                        {description && (
                            <p className="text-small text-[var(--text-secondary)] mt-1">{description}</p>
                        )}
                    </div>
                </div>

                {rightAction && (
                    <div className="flex items-center justify-end gap-3 flex-wrap mt-2 md:mt-0 self-end md:self-auto">
                        {rightAction}
                    </div>
                )}
            </div>

            <div className="mt-8">
                {children}
            </div>
        </div>
    );
};

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { cn } from '@/lib/utils';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'danger' | 'success';
    icon?: React.ReactNode;
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

const variantClasses = {
    default: '',
    danger: 'border-[var(--status-danger-border)] border-2 shadow-[0_0_0_4px_var(--status-danger-glow)]',
    success: 'border-[var(--status-success-border)] border-2 shadow-[0_0_0_4px_var(--status-success-glow)]',
};

const iconContainerClasses = {
    default: 'bg-[var(--action-secondary-bg)] text-[var(--action-secondary-text)]',
    danger: 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]',
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
};

export const AdminModal: React.FC<AdminModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    variant = 'default',
    icon,
    className,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(sizeClasses[size], variantClasses[variant], 'max-h-[90vh] flex flex-col', className)}>
                {icon && (
                    <div className={cn('w-14 h-14 rounded-[var(--radius-container)] flex items-center justify-center mx-auto mt-2', iconContainerClasses[variant])}>
                        {icon}
                    </div>
                )}
                <DialogHeader className={cn(icon && 'text-center')}>
                    <DialogTitle className={cn('text-h2 text-[var(--text-main)]', icon && 'text-center')}>
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className={cn('text-[var(--text-muted)]', icon && 'text-center')}>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                    {children}
                </div>
                {footer && (
                    <div className="pt-4 border-t border-[var(--border-main)] flex gap-3">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

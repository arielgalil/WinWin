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
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export const AdminModal: React.FC<AdminModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    className,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(sizeClasses[size], 'max-h-[90vh] flex flex-col', className)}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
                    {children}
                </div>
                {footer && (
                    <div className="pt-4 border-t border-border flex gap-3">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

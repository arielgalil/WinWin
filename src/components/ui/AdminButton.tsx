import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-[var(--radius-main)] font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none gap-2 shadow-sm";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20",
    secondary: "bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-main)]",
    outline: "bg-transparent border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
    ghost: "bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-none",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3 text-base"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

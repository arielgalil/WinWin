import React from 'react';

interface AdminActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  variant?: 'edit' | 'delete' | 'secondary';
  children: React.ReactNode;
  className?: string;
  title?: string;
  disabled?: boolean;
  circular?: boolean;
}

export const AdminActionButton: React.FC<AdminActionButtonProps> = ({
  onClick,
  variant = 'secondary',
  children,
  className = '',
  title,
  disabled = false,
  circular = false
}) => {
  const baseStyles = `p-2 ${circular ? 'rounded-full hover:scale-110 shadow-md' : 'rounded-[var(--radius-main)]'} transition-all flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 disabled:opacity-50 disabled:pointer-events-none`;
  
  const variantStyles = {
    edit: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20",
    delete: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",
    secondary: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
  };

  return (
    <button
      onClick={onClick}
      data-testid={`action-button-${variant}`}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      title={title}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

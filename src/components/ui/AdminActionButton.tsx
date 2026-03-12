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
    edit: "bg-[var(--action-edit-bg)] text-[var(--action-edit-text)] hover:bg-[var(--action-edit-hover)]",
    delete: "bg-[var(--action-delete-bg)] text-[var(--action-delete-text)] hover:bg-[var(--action-delete-hover)]",
    secondary: "bg-[var(--action-secondary-bg)] text-[var(--action-secondary-text)] hover:bg-[var(--action-secondary-hover)]"
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

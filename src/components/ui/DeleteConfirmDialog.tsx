import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { AdminModal } from './AdminModal';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'מחק',
  cancelText = 'ביטול',
  isDanger = true,
}: DeleteConfirmDialogProps) {
  const icon = isDanger ? <Trash2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
      size="sm"
      variant={isDanger ? 'danger' : 'default'}
      icon={icon}
    >
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onOpenChange(false)}
          className="flex-1 h-11 rounded-[var(--radius-main)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-main)]"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'flex-1 h-11 rounded-[var(--radius-main)] font-bold transition-all border',
            isDanger
              ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--status-danger-border)] hover:text-white border-[var(--border-main)]'
              : 'bg-[var(--primary-base)] hover:bg-[var(--primary-hover)] text-white border-transparent'
          )}
        >
          {confirmText}
        </button>
      </div>
    </AdminModal>
  );
}

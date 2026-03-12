import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { AdminModal } from './AdminModal';

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

const cancelClass =
  'flex-1 h-11 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--border-main)] text-[var(--text-secondary)] ' +
  'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] ' +
  'focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring-outline)]';

const confirmDangerClass =
  'flex-1 h-11 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--status-danger-border)]/40 text-[var(--text-main)] ' +
  'hover:bg-[var(--status-danger-border)] hover:text-white hover:border-[var(--status-danger-border)] ' +
  'focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--status-danger-border)]';

const confirmDefaultClass =
  'flex-1 h-11 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--primary-base)]/40 text-[var(--text-main)] ' +
  'hover:bg-[var(--primary-base)] hover:text-white hover:border-[var(--primary-base)] ' +
  'focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary-base)]';

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
          className={cancelClass}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={isDanger ? confirmDangerClass : confirmDefaultClass}
        >
          {confirmText}
        </button>
      </div>
    </AdminModal>
  );
}

import React, { useEffect, useRef } from 'react';
import { AlertIcon, TrashIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { AdminModal } from './AdminModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  showCancel = true,
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  const { t } = useLanguage();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const finalConfirmText = confirmText || t('confirm_action');
  const finalCancelText = cancelText || t('cancel');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const icon = isDanger
    ? <TrashIcon className="w-8 h-8" />
    : <AlertIcon className="w-8 h-8" />;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={message}
      size="sm"
      variant={isDanger ? 'danger' : 'default'}
      icon={icon}
    >
      <div className="flex gap-3 pt-2">
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          className={`flex-1 py-3 rounded-[var(--radius-main)] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
            isDanger
              ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--status-danger-border)] hover:text-white border border-[var(--border-main)]'
              : 'bg-[var(--primary-base)] hover:bg-[var(--primary-hover)] text-white'
          }`}
        >
          {finalConfirmText}
        </button>

        {showCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-[var(--radius-main)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-main)]"
          >
            {finalCancelText}
          </button>
        )}
      </div>
    </AdminModal>
  );
};

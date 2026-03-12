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

const cancelClass =
  'flex-1 py-3 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--border-main)] text-[var(--text-secondary)] ' +
  'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/30';

const confirmDangerClass =
  'flex-1 py-3 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--status-danger-border)]/40 text-[var(--text-main)] ' +
  'hover:bg-[var(--status-danger-border)] hover:text-white hover:border-[var(--status-danger-border)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger-border)]/40';

const confirmDefaultClass =
  'flex-1 py-3 rounded-[var(--radius-main)] font-bold transition-all active:scale-95 ' +
  'bg-transparent border border-[var(--primary-base)]/40 text-[var(--text-main)] ' +
  'hover:bg-[var(--primary-base)] hover:text-white hover:border-[var(--primary-base)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-base)]/40';

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
          className={isDanger ? confirmDangerClass : confirmDefaultClass}
        >
          {finalConfirmText}
        </button>

        {showCancel && (
          <button onClick={onCancel} className={cancelClass}>
            {finalCancelText}
          </button>
        )}
      </div>
    </AdminModal>
  );
};

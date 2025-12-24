import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;

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
  const { t, dir } = useLanguage();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const finalConfirmText = confirmText || t('confirm_action');
  const finalCancelText = cancelText || t('cancel');

  // Simple focus trapping / auto-focus
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure animation has started/rendered
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" dir={dir}>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{ border: isDanger ? '2px solid #ef4444' : undefined }}
            className={`relative bg-white dark:bg-[#1e1e2e] border p-8 rounded-[var(--radius-container)] shadow-2xl max-w-sm w-full overflow-hidden ${
              isDanger ? '!border-red-500 border-2 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]' : 'border-gray-200 dark:border-white/10'
            }`}
          >
            <div className={`w-14 h-14 rounded-[var(--radius-container)] flex items-center justify-center mb-6 mx-auto ${
              isDanger 
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' 
                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            }`}>
              <AlertIcon className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>

            <div className="flex gap-3">
              {/* Confirm is first in DOM to be Right-most in RTL flex-row */}
              <button
                ref={confirmButtonRef}
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-[var(--radius-main)] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                  isDanger
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-white/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {finalConfirmText}
              </button>
              
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-[var(--radius-main)] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
                >
                  {finalCancelText}
                </button>
              )}
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
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
  onConfirm,
  onCancel
}) => {
  const { t, dir } = useLanguage();

  const finalConfirmText = confirmText || t('confirm_action');
  const finalCancelText = cancelText || t('cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir={dir}>
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
            className="relative bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-slate-500/20 text-slate-400">
              <AlertIcon className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>
            <p className="text-slate-300 text-center mb-6 text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>

            <div className="flex gap-3">
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-2 rounded-xl bg-slate-600 text-white font-bold hover:bg-slate-500 transition-colors shadow-lg"
                >
                  {finalCancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`py-2 rounded-xl bg-slate-600 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${!showCancel ? 'flex-1 w-full' : 'flex-1'
                  } hover:bg-slate-500`}
              >
                {finalConfirmText}
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

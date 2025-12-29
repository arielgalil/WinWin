import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from './Icons';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const { dir } = useLanguage();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-[501] flex items-center justify-center p-4" dir={dir}>
              <Dialog.Content asChild>
                <MotionDiv
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative bg-white dark:bg-[#1e1e2e] p-8 rounded-[var(--radius-container)] shadow-2xl max-w-lg w-full overflow-hidden border-2 border-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                        <XIcon className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="mt-2">
                    {children}
                  </div>
                </MotionDiv>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

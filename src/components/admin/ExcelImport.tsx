import React, { useState, useRef } from 'react';
import { UploadIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminModal } from '../ui/AdminModal';
import { Button } from '../ui/button';
import { parseExcelFile } from '../../utils/excelUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useErrorFormatter } from '../../utils/errorUtils';

interface ExcelImportProps {
  onImport: (classes: any[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onImport, isOpen, onClose }) => {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { modalConfig, openConfirmation, closeConfirmation } = useConfirmation();
  const { getErrorMessage } = useErrorFormatter();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const classes = await parseExcelFile(file);
      if (classes.length === 0) {
        openConfirmation({
          title: t('no_data_found'),
          message: t('excel_empty_error'),
          confirmText: t('ok'),
          onConfirm: closeConfirmation
        });
        return;
      }
      onImport(classes);
      onClose();
      showToast(t('excel_import_success'), 'success');
    } catch (error) {
      console.error("Excel import error:", error);
      openConfirmation({
        title: t('import_error'),
        message: getErrorMessage(error),
        confirmText: t('ok'),
        onConfirm: closeConfirmation
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('bulk_import_excel')}
        description={t('excel_format_info')}
        size="md"
        icon={<UploadIcon className="w-8 h-8" />}
      >
        <div className="space-y-6">
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`mt-4 p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center gap-4 ${
              isProcessing 
                ? 'bg-[var(--bg-surface)] border-[var(--border-main)] opacity-50 cursor-not-allowed' 
                : 'bg-[var(--bg-input)] border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500">
              <UploadIcon className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-[var(--text-main)] text-lg">{t('drag_or_click_excel')}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{t('excel_format_info')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-main)]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {t('import')}
            </Button>
          </div>
        </div>
      </AdminModal>

      {modalConfig.isOpen && (
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          isDanger={modalConfig.isDanger}
        />
      )}
    </>
  );
};
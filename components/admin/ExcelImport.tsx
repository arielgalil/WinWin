import React, { useState, useRef } from 'react';
import { UploadIcon, XIcon, AlertIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
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
          type: 'alert',
          title: t('no_data_found'),
          message: t('excel_empty_error'),
          confirmLabel: t('ok'),
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
        type: 'alert',
        title: t('import_error'),
        message: getErrorMessage(error),
        confirmLabel: t('ok'),
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
      <ConfirmationModal
        isOpen={true}
        title={t('bulk_import_excel')}
        message=""
        confirmLabel={isProcessing ? t('processing') : t('import')}
        cancelLabel={t('cancel')}
        onConfirm={() => fileInputRef.current?.click()}
        onCancel={onClose}
        isDisabled={isProcessing}
      >
        <div className="mt-4 p-4 border-2 border-dashed border-white/20 rounded-lg">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <UploadIcon className="w-8 h-8 text-white/60" />
            <div className="text-center text-white/80">
              <p className="font-medium">{t('drag_or_click_excel')}</p>
              <p className="text-sm text-white/60">{t('excel_format_info')}</p>
            </div>
          </div>
        </div>
      </ConfirmationModal>
      
      {modalConfig && (
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          isDisabled={modalConfig.isDisabled}
          type={modalConfig.type}
        />
      )}
    </>
  );
};
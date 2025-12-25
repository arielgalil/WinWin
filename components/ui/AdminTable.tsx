import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;
const MotionTr = motion.tr as any;

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

export const AdminTable = <T extends Record<string, any>>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage,
  onRowClick,
  actions
}: AdminTableProps<T>) => {
  const { t } = useLanguage();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">{t('loading')}...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-gray-500">{emptyMessage || t('no_data_available')}</div>;
  }

  return (
    <div className="w-full">
      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-[var(--bg-card)] rounded-[var(--radius-container)] border border-[var(--border-main)] overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--bg-surface)] text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest text-right">
              {columns.map(col => (
                <th key={col.key} className="p-4">{col.header}</th>
              ))}
              {actions && <th className="p-4 text-center w-[120px]">{t('actions_header')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divide-main)] text-sm text-[var(--text-secondary)]">
            <AnimatePresence>
              {data.map((item) => (
                <MotionTr
                  key={String(item[keyField])}
                  data-testid={`row-${String(item[keyField])}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`hover:bg-[var(--bg-hover)] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map(col => (
                    <td key={`${String(item[keyField])}-${col.key}`} className="p-4">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </MotionTr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Visible on mobile) */}
      <div className="md:hidden space-y-4">
        <AnimatePresence>
          {data.map((item) => (
            <MotionDiv
              key={String(item[keyField])}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="bg-[var(--bg-card)] rounded-[var(--radius-container)] border border-[var(--border-main)] p-4 shadow-sm"
              onClick={() => onRowClick?.(item)}
              role="article" // For accessibility and testing
            >
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col.key} className="flex justify-between items-center border-b border-[var(--divide-main)] last:border-0 pb-2 last:pb-0">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{col.header}</span>
                    <span className="text-sm font-medium text-[var(--text-main)] text-right">
                      {col.render ? col.render(item) : item[col.key]}
                    </span>
                  </div>
                ))}
              </div>
              
              {actions && (
                <div className="mt-4 pt-4 border-t border-[var(--divide-main)] flex justify-end gap-2" onClick={(e: any) => e.stopPropagation()}>
                  {actions(item)}
                </div>
              )}
            </MotionDiv>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

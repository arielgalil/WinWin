import React from 'react';
import { PlusIcon, RefreshIcon, SearchIcon } from '../ui/Icons';
import { useLanguage } from '../../hooks/useLanguage';

interface ClassListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddClass: () => void;
  onRefresh: () => Promise<void>;
}

export const ClassListHeader: React.FC<ClassListHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onAddClass,
  onRefresh
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
        <div className="relative flex-1 sm:max-w-md">
          <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_classes_placeholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm ps-10 text-sm"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm"
        >
          <RefreshIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('refresh')}</span>
        </button>
        <button
          onClick={onAddClass}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/20 text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('add_class_label')}</span>
        </button>
      </div>
    </div>
  );
};
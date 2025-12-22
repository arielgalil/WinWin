import React from 'react';
import { PlusIcon, RefreshIcon, SearchIcon } from '../ui/Icons';


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

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
        <div className="relative flex-1 sm:max-w-md">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <RefreshIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          onClick={onAddClass}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add Class</span>
        </button>
      </div>
    </div>
  );
};
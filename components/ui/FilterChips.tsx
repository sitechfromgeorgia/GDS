
import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ chips, onRemove, onClearAll }) => {
  const { t } = useTranslation();

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {t('filters.active')}:
      </span>

      {chips.map(chip => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <span className="text-slate-400 dark:text-slate-500">{chip.label}:</span>
          <span className="font-bold">{chip.value}</span>
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-0.5 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:underline transition-colors ml-2"
      >
        {t('filters.clear_all')}
      </button>
    </div>
  );
};

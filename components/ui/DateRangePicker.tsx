
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

interface DateRangePickerProps {
  value: DatePreset;
  onChange: (preset: DatePreset, customRange?: { start: string; end: string }) => void;
  customRange?: { start: string; end: string };
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  customRange
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localStart, setLocalStart] = useState(customRange?.start || '');
  const [localEnd, setLocalEnd] = useState(customRange?.end || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'all', label: t('filters.all_time') },
    { value: 'today', label: t('filters.today') },
    { value: 'yesterday', label: t('filters.yesterday') },
    { value: 'week', label: t('filters.last_7_days') },
    { value: 'month', label: t('filters.last_30_days') },
    { value: 'lastMonth', label: t('filters.last_month') },
    { value: 'custom', label: t('filters.custom_range') }
  ];

  const getDisplayLabel = () => {
    if (value === 'custom' && customRange?.start && customRange?.end) {
      return `${customRange.start} - ${customRange.end}`;
    }
    return presets.find(p => p.value === value)?.label || t('filters.all_time');
  };

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset !== 'custom') {
      onChange(preset);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (localStart && localEnd) {
      onChange('custom', { start: localStart, end: localEnd });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-11 px-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="max-w-[150px] truncate">{getDisplayLabel()}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Preset Options */}
          <div className="p-2">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-2">
              {t('filters.quick_select')}
            </div>
            {presets.filter(p => p.value !== 'custom').map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  value === preset.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Range */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              {t('filters.custom_range')}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {t('filters.from')}
                </label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {t('filters.to')}
                </label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!localStart || !localEnd}
                className="w-full h-9 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-white transition-colors"
              >
                {t('filters.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

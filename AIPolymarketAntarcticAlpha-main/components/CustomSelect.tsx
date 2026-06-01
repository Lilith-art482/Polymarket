'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  label?: string;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, icon, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
      >
        {selected?.icon || (selected && icon)}
        <span className={`flex-1 text-left ${!selected ? 'text-gray-400 dark:text-gray-500' : ''}`}>
          {selected?.label || placeholder || value}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 transition-transform duration-200"
          viewBox="0 0 20 20"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden animate-in fade-in">
          {options.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setOpen(false); onChange(opt.value); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {opt.icon || icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

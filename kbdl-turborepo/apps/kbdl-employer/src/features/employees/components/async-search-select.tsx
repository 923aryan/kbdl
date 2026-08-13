'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export type AsyncSearchOption = {
  id: string;
  label: string;
  sublabel?: string;
};

type AsyncSearchSelectProps = {
  label: string;
  required?: boolean;
  placeholder: string;
  valueId: string;
  valueLabel: string;
  options: AsyncSearchOption[];
  loading?: boolean;
  error?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (option: AsyncSearchOption) => void;
  onClear?: () => void;
};

export function AsyncSearchSelect({
  label,
  required,
  placeholder,
  valueId,
  valueLabel,
  options,
  loading = false,
  error = null,
  search,
  onSearchChange,
  onSelect,
  onClear,
}: AsyncSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-left text-sm outline-none ${error ? 'border-[#F54A4A] focus:border-[#F54A4A]' : 'border-[#D3D3D3] focus:border-[#0658C2]'}`}>
        <span className={valueId ? 'text-black' : 'text-[#676767]'}>
          {valueLabel || placeholder}
        </span>
        <ChevronDown className={`h-5 w-5 text-black transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-[#DBEAFF] bg-white shadow-xl">
          <div className="relative border-b border-[#EFEFEF] p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676767]" />
            <input
              autoFocus
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-10 w-full rounded-md border border-[#D3D3D3] pl-9 pr-3 text-sm outline-none focus:border-[#0658C2]"
            />
          </div>

          <div id={listId} role="listbox" className="max-h-[240px] overflow-y-auto p-1">
            {loading && (
              <p className="px-3 py-2 text-sm text-[#676767]">Searching…</p>
            )}
            {!loading && error && (
              <p className="px-3 py-2 text-sm text-[#F54A4A]">{error}</p>
            )}
            {!loading && !error && options.length === 0 && (
              <p className="px-3 py-2 text-sm text-[#676767]">No results</p>
            )}
            {!loading &&
              !error &&
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === valueId}
                  onClick={() => {
                    onSelect(option);
                    setOpen(false);
                    onSearchChange('');
                  }}
                  className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-[#DBEAFF] ${
                    option.id === valueId ? 'bg-[#DBEAFF] text-[#0658C2]' : ''
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-xs text-[#676767]">{option.sublabel}</span>
                  )}
                </button>
              ))}
          </div>

          {valueId && onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="w-full border-t border-[#EFEFEF] px-3 py-2 text-left text-sm text-[#F54A4A]"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
      {error && <span className="mt-1 block text-xs font-medium text-[#F54A4A]">{error}</span>}
    </div>
  );
}

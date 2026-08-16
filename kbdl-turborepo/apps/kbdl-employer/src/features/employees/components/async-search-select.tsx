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
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-base font-semibold outline-none ${
          open
            ? 'border-[#0658C2] text-blue-950'
            : error
              ? 'border-[#F54A4A] text-gray-900'
              : 'border-gray-300 text-gray-900'
        }`}
      >
        <span className={valueId ? 'font-normal text-sm text-[#111827]' : 'font-normal text-sm text-gray-500'}>
          {valueLabel || placeholder}
        </span>

        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-full rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          {/* Search */}
          <div className="relative mb-3">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-md border border-transparent bg-[#F8F8F8] px-4 py-[9px] pr-10 text-sm outline-none focus:border-[#0658C2]"
            />

            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
          </div>

          {/* Selected */}
          {valueId && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected</span>

                {onClear && (
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      onSearchChange('');
                    }}
                    className="cursor-pointer normal-case text-[#0658C2]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-[150px] space-y-1 overflow-y-auto border-b border-[#D3D3D3] pb-3">
                <button
                  type="button"
                  onClick={() => {
                    onClear?.();
                    onSearchChange('');
                  }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-[9px] text-left text-sm text-[#0658C2]"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{valueLabel}</span>
                  </div>

                  <span className="relative h-4 w-4 rounded bg-white">
                    <span className="absolute inset-0 left-[2px] top-[-2px] w-[22px] bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] bg-no-repeat" />
                  </span>
                </button>
              </div>
            </>
          )}

          {/* Available */}
          <p className="px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
            Available {label}
          </p>

          <div
            id={listId}
            role="listbox"
            className="max-h-[260px] space-y-1 overflow-y-auto"
          >
            {loading && (
              <p className="px-3 py-2 text-sm text-[#676767]">
                Searching...
              </p>
            )}

            {!loading && error && (
              <p className="px-3 py-2 text-sm text-[#F54A4A]">
                {error}
              </p>
            )}

            {!loading && !error && options.length === 0 && (
              <p className="px-3 py-2 text-sm text-[#676767]">
                No results found
              </p>
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
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md border px-4 py-[9px] text-left text-sm transition-colors ${
                    option.id === valueId
                      ? 'border-transparent bg-[#DBEAFF] text-[#0658C2]'
                      : 'border-[#D3D3D3] text-gray-900 hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>

                    {option.sublabel && (
                      <span className="text-xs text-[#676767]">
                        {option.sublabel}
                      </span>
                    )}
                  </div>

                  {option.id === valueId && (
                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 left-[2px] top-[-2px] w-[22px] bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] bg-no-repeat" />
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {error && (
        <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
          {error}
        </span>
      )}
    </div>
  );
}

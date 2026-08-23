'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

import type { MultiSearchOption } from './dropdown.types';
import { useClickOutside } from './useClickOutside';

type AsyncMultiSearchSelectProps = {
  label: string;
  required?: boolean;
  placeholder: string;
  selected: string[];
  options: MultiSearchOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  onClear?: () => void;
  error?: string;
};

export function AsyncMultiSearchSelect({
  label,
  required,
  placeholder,
  selected,
  options,
  search,
  onSearchChange,
  onAdd,
  onRemove,
  onClear,
  error,
}: AsyncMultiSearchSelectProps) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const availableOptions = useMemo(
    () =>
      options.filter(
        (option) => !selected.includes(option.label),
      ),
    [options, selected],
  );

  useClickOutside(rootRef, open, () => {
    setOpen(false);
    onSearchChange('');
  });

  const handleAdd = (option: MultiSearchOption) => {
    onAdd(option.label);
    onSearchChange('');
  };

  const handleRemove = (label: string) => {
    onRemove(label);
  };

  const handleClear = () => {
    onClear?.();
    onSearchChange('');
  };

  return (
    <div ref={rootRef} className="relative block">
      {/* Label */}
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>

      {/* Select Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-base font-semibold outline-none ${
          open
            ? 'border-[#0658C2] text-blue-950'
            : error
              ? 'border-[#F54A4A] text-gray-900'
              : 'border-gray-300 text-gray-400'
        }`}
      >
        <span
          className={
            selected.length
              ? 'text-sm font-normal text-[#111827]'
              : 'text-sm font-normal text-gray-500'
          }
        >
          {selected.length
            ? `${selected.length} selected`
            : placeholder}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-black transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-[#DBEAFF] bg-[#F5F9FF] px-3 py-1 text-xs font-medium text-[#0658C2]"
            >
              {item}

              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => handleRemove(item)}
                className="rounded-full p-0.5 hover:bg-[#DBEAFF]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
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
          {selected.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected ({selected.length})</span>

                {onClear && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="cursor-pointer normal-case text-[#0658C2]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-[150px] space-y-1 overflow-y-auto border-b border-[#D3D3D3] pb-3">
                {selected.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-[9px] text-left text-sm text-[#0658C2]"
                  >
                    {item}

                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 left-[2px] top-[-2px] w-[22px] bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] bg-no-repeat" />
                    </span>
                  </button>
                ))}
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
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  onClick={() => handleAdd(option)}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-md border border-[#D3D3D3] px-4 py-[9px] text-left text-sm hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]"
                >
                  {option.label}

                  <span className="h-4 w-4 rounded border border-[#D3D3D3] group-hover:border-transparent group-hover:bg-white" />
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">
                No results found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
          {error}
        </span>
      )}
    </div>
  );
}

export default AsyncMultiSearchSelect;
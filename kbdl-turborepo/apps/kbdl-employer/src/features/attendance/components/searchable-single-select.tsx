'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

type SearchSelectOption = {
  value: string;
  label: string;
};

type SearchableSingleSelectProps = {
  label: string;
  required?: boolean;
  placeholder: string;
  options: SearchSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function SearchableSingleSelect({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: SearchableSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localValue, setLocalValue] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedValue = value ?? localValue;

  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const handleSelect = (option: SearchSelectOption) => {
    setLocalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    setSearch('');
  };

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-base font-semibold outline-none ${
          disabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'cursor-pointer'
        } ${
          open
            ? 'border-[#0658C2] text-blue-950'
            : error
              ? 'border-[#F54A4A] text-gray-900'
              : 'border-gray-300 text-gray-900'
        }`}
      >
        <span
          className={
            selectedValue
              ? 'text-sm font-normal text-[#111827]'
              : 'text-sm font-normal text-gray-500'
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-black transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 z-40 mt-2 w-full rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          {/* Search */}
          <div className="relative mb-3">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-md border border-transparent bg-[#F8F8F8] px-4 py-[9px] pr-10 text-sm outline-none focus:border-[#0658C2]"
            />

            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
          </div>

          {/* Selected */}
          {selectedOption && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected</span>

                <button
                  type="button"
                  onClick={handleClear}
                  className="cursor-pointer normal-case text-[#0658C2]"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[150px] space-y-1 overflow-y-auto border-b border-[#D3D3D3] pb-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-[9px] text-left text-sm text-[#0658C2]"
                >
                  {selectedOption.label}

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
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selectedValue === option.value}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md border px-4 py-[9px] text-left text-sm transition-colors ${
                    selectedValue === option.value
                      ? 'border-transparent bg-[#DBEAFF] text-[#0658C2]'
                      : 'border-[#D3D3D3] text-gray-900 hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                  }`}
                >
                  {option.label}

                  {selectedValue === option.value && (
                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 left-[2px] top-[-2px] w-[22px] bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] bg-no-repeat" />
                    </span>
                  )}
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

      {error && (
        <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
          {error}
        </span>
      )}
    </div>
  );
}
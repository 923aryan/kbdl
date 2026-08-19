'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

type SelectFieldProps = {
  id?: string;
  label: string;
  placeholder: string;
  required?: boolean;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
};

export function SelectField({
  id,
  label,
  placeholder,
  required,
  options,
  value,
  onChange,
  error,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedValue = value ?? localValue;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSelect = (option: string) => {
    setLocalValue(option);
    onChange?.(option);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
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
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-base font-semibold outline-none ${
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
          {selectedValue || placeholder}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-black transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 z-40 mt-2 w-full rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          {/* Selected */}
          {selectedValue && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected</span>

                <button
                  type="button"
                  onClick={handleClear}
                  className="hidden cursor-pointer normal-case text-[#0658C2]"
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
                  {selectedValue}

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
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selectedValue === option}
                  onClick={() => handleSelect(option)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-md border px-4 py-[9px] text-left text-sm ${
                    selectedValue === option
                      ? 'border-transparent bg-[#DBEAFF] text-[#0658C2]'
                      : 'border-[#D3D3D3] text-gray-900 hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                  }`}
                >
                  {option}

                  {selectedValue === option && (
                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 left-[2px] top-[-2px] w-[22px] bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] bg-no-repeat" />
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">
                No options found
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

export default SelectField;
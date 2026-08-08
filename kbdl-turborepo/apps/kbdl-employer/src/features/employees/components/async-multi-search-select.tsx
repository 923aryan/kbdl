'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type MultiSearchOption = {
  id: string;
  label: string;
};

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
}: AsyncMultiSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const availableOptions = useMemo(
    () => options.filter((option) => !selected.includes(option.label)),
    [options, selected],
  );

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
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-[#D3D3D3] px-4 py-2 text-left text-sm outline-none focus:border-[#0658C2]"
      >
        <span className={selected.length ? 'text-black' : 'text-[#676767]'}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-black" />
      </button>

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
                onClick={() => onRemove(item)}
                className="rounded-full p-0.5 hover:bg-[#DBEAFF]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

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
            {availableOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-[#676767]">No results</p>
            )}
            {availableOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                onClick={() => {
                  onAdd(option.label);
                  onSearchChange('');
                }}
                className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#DBEAFF]"
              >
                {option.label}
              </button>
            ))}
          </div>

          {selected.length > 0 && onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="w-full border-t border-[#EFEFEF] px-3 py-2 text-left text-sm text-[#F54A4A]"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

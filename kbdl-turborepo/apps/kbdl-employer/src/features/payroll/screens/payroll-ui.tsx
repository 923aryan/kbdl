'use client';

import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { payrollMonthOptions } from '../data/payroll-data';
import { usePayrollStore } from '../stores/use-payroll-store';

export const money = (value: number) => `Rs ${value.toLocaleString('en-IN')}`;

export function errMessage(err: unknown, fallback = 'Failed to load') {
  return err instanceof Error ? err.message : fallback;
}

export function RefreshIconButton({
  loading,
  onClick,
  title = 'Refresh',
}: {
  loading?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      title={title}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#676767] transition hover:bg-[#F8FAFC] disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
    </button>
  );
}

export function LoadState({
  loading,
  error,
  hasData,
  onRetry,
  children,
  label = 'Loading...',
}: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onRetry: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  if (loading && !hasData) {
    return (
      <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm font-semibold text-[#676767]">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex cursor-pointer items-center gap-2 font-semibold text-[#0658C2]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
          <span>Could not refresh: {error}</span>
          <button type="button" onClick={onRetry} className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#0658C2]">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}
      {loading && (
        <div className="mb-3 inline-flex items-center gap-2 text-sm text-[#676767]">
          <Loader2 className="h-4 w-4 animate-spin" /> Updating…
        </div>
      )}
      {children}
    </>
  );
}

export function Header() {

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-5">
        <div className="relative">
          <button className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
          </button>
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            8
          </span>
        </div>
        <div className="hidden h-10 w-px bg-gray-200 sm:block" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFF] text-xs font-bold text-[#0658C2]">KB</div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Kaam Badlo</p>
            <p className="text-xs text-[#676767]">HRMS Portal</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A]">
      <main className="p-5 lg:p-6">{children}</main>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
  gps,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  gps?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-normal text-black">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#676767]">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {gps && <p className="text-sm"><span className="font-semibold">Mobile GPS :</span> <span className="text-[#676767]">Last Synced</span> <span className="font-semibold">9:15 AM</span></p>}
        {action}
      </div>
    </div>
  );
}

export function MonthSelect() {
  const { selectedPeriod, setSelectedPeriod, openDropdown, setOpenDropdown } = usePayrollStore();
  const dropdownId = 'payroll-month';
  const open = openDropdown === dropdownId;
  const months = payrollMonthOptions();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : dropdownId)}
        className={`inline-flex h-12 min-w-[210px] cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-4 text-base font-semibold ${open ? 'border-[#0658C2] text-blue-950' : 'border-[#D3D3D3]'}`}
      >
        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {selectedPeriod.label}</span>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[230px] rounded-xl border border-[#DBEAFF] bg-white p-2 shadow-xl">
          {months.map((month) => (
            <button
              key={month.label}
              type="button"
              onClick={() => {
                setSelectedPeriod(month);
                setOpenDropdown(null);
              }}
              className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-[#DBEAFF] hover:text-[#0658C2] ${month.label === selectedPeriod.label ? 'bg-[#DBEAFF] font-semibold text-[#0658C2]' : 'text-gray-900'}`}
            >
              {month.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-7 text-base font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#0658C2] bg-white px-7 text-base font-semibold text-[#0658C2] hover:bg-[#DBEAFF]">
      {children}
    </button>
  );
}

export function StatCard({
  title,
  value,
  note,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'violet';
}) {
  const colors = {
    blue: 'bg-[#DBEAFF] text-[#0658C2]',
    green: 'bg-[#E5FFEB] text-[#4CAF50]',
    orange: 'bg-[#FFF4E3] text-[#FFA000]',
    violet: 'bg-[#EDE9FE] text-[#8B5CF6]',
  };

  return (
    <div className="min-h-[104px] rounded-[20px] border border-[#ECECEC] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-[#676767]">{title}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[22px] font-bold text-black">{value}</p>
      {note && <p className="mt-1 text-xs text-[#676767]">{note}</p>}
    </div>
  );
}

export function SearchAndFilters({
  search,
  onSearch,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-[500px]">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="h-12 w-full rounded-lg border border-[#D3D3D3] bg-white px-6 pr-12 text-sm outline-none focus:border-[#0658C2]"
          placeholder="Search Employee..."
        />
        <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
      </div>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}

export function SelectButton({
  label,
  selectedLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  selectedLabel: string;
  options: string[];
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  const { openDropdown, setOpenDropdown } = usePayrollStore();
  const [search, setSearch] = useState('');
  const dropdownId = `payroll-filter-${selectedLabel}`;
  const open = openDropdown === dropdownId;
  const selectedText = selected.length ? `${selectedLabel} (${selected.length})` : label;
  const filteredOptions = useMemo(
    () => options.filter((option) => !selected.includes(option) && option.toLowerCase().includes(search.toLowerCase())),
    [options, search, selected]
  );
  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : dropdownId)}
        className={`inline-flex h-12 min-w-[190px] cursor-pointer items-center justify-between rounded-xl border bg-white px-6 text-base font-semibold ${open ? 'border-[#0658C2] text-blue-950' : 'border-[#D3D3D3] text-gray-900'}`}
      >
        {selectedText}
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[300px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676767]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#D3D3D3] px-3 pr-10 text-sm outline-none focus:border-[#0658C2]"
              placeholder={`Search ${selectedLabel}...`}
            />
          </div>
          {selected.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-xs font-semibold uppercase text-[#676767]">Selected {selectedLabel}</p>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="cursor-pointer text-xs font-semibold text-[#0658C2] hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="mb-3 max-h-[155px] space-y-1 overflow-y-auto border-b border-[#D3D3D3] pb-3">
                {selected.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-2 text-left text-sm text-[#0658C2]"
                  >
                    {option}
                    <span className="grid h-4 w-4 place-items-center rounded bg-white text-xs"><Check className="h-3 w-3" /></span>
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="px-1 pb-2 text-xs font-semibold uppercase text-[#676767]">Available {selectedLabel}</p>
          <div className="max-h-[220px] space-y-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-md border border-[#D3D3D3] px-4 py-2 text-left text-sm hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]"
                >
                  {option}
                  <span className="h-4 w-4 rounded border border-[#D3D3D3] group-hover:border-transparent group-hover:bg-white" />
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[20px] border border-[#D3D3D3] bg-white shadow-sm ${className}`}>{children}</section>;
}

export function EmployeeCell({ name, designation, id }: { name: string; designation: string; id: string }) {
  return (
    <div>
      <p className="font-medium leading-4 text-black">{name}</p>
      <p className="text-xs text-[#676767]">{designation} | {id}</p>
    </div>
  );
}

export function Pagination({
  page = 1,
  pageCount = 1,
  onPageChange,
}: {
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
}) {
  const pages = Array.from({ length: Math.min(pageCount, 3) }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
      {pages.map((item) => <button type="button" key={item} onClick={() => onPageChange?.(item)} className={`h-8 min-w-8 cursor-pointer rounded-lg px-2 ${item === page ? 'bg-gray-100 font-semibold text-[#0658C2]' : ''}`}>{item}</button>)}
      {pageCount > 3 && <span className="px-1 text-[#676767]">...</span>}
      {pageCount > 3 && <button type="button" onClick={() => onPageChange?.(pageCount)} className={`h-8 min-w-8 cursor-pointer rounded-lg px-2 ${pageCount === page ? 'bg-gray-100 font-semibold text-[#0658C2]' : ''}`}>{pageCount}</button>}
      <button type="button" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
    </div>
  );
}

export function StatusPill({ children, tone }: { children: React.ReactNode; tone: 'blue' | 'green' | 'orange' | 'red' }) {
  const tones = {
    blue: 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]',
    green: 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]',
    orange: 'border-[#FFA000] bg-[#FFF4E3] text-[#FFA000]',
    red: 'border-[#F54A4A] bg-[#FEE9E5] text-[#F54A4A]',
  };

  return <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

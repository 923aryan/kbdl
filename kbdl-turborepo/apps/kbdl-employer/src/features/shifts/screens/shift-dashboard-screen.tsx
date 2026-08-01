'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import { CreateShiftModal } from './create-shift-swap-screen';
import { ShiftDetailsModal } from './shift-details-modal';
import { ShiftListScreen } from './shift-list-screen';
import { type ShiftCreator, type ShiftStatus, useShiftStore } from '../stores/use-shift-store';

const STATUS_OPTIONS: Exclude<ShiftStatus, 'all'>[] = [
  'open',
  'pending',
  'approved',
  'rejected',
  'absent',
  'completed',
  'cancelled',
];

const CREATED_BY_OPTIONS: { label: string; value: ShiftCreator }[] = [
  { label: 'All Creators', value: 'all' },
  { label: 'Employer', value: 'employer' },
  { label: 'Worker', value: 'worker' },
];

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

type FilterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const DateFilter = ({ isOpen, setIsOpen }: FilterProps) => {
  const { filters, setFilters } = useShiftStore();
  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const label = hasDateFilter
    ? `${filters.dateFrom || 'Any'} - ${filters.dateTo || 'Any'}`
    : 'Date Range';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 min-w-40 items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 cursor-pointer"
      >
        <span>{label}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-20 w-80 rounded-xl border border-blue-100 bg-white p-3 shadow-xl">
          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium text-gray-900">
              From Date
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters({ dateFrom: event.target.value })}
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-gray-900">
              To Date
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters({ dateTo: event.target.value })}
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-between gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={() => setFilters({ dateFrom: '', dateTo: '' })}
              className="h-9 rounded-md border border-[#0658c2] px-4 text-sm font-medium cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-9 rounded-md bg-[#0658c2] px-4 text-sm font-medium text-white cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatedByFilter = ({ isOpen, setIsOpen }: FilterProps) => {
  const { filters, setFilters } = useShiftStore();
  const selected = CREATED_BY_OPTIONS.find((option) => option.value === filters.createdBy);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 min-w-40 items-center justify-between rounded-xl border border-gray-300 px-4 text-base font-semibold cursor-pointer text-gray-900"
      >
        <span>{selected?.label || 'Created By'}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-20 w-64 rounded-xl border border-blue-100 bg-white p-3 shadow-xl">
          {CREATED_BY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFilters({ createdBy: option.value });
                setIsOpen(false);
              }}
              className={`mb-1 flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium ${
                filters.createdBy === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
              {filters.createdBy === option.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusFilter = ({ isOpen, setIsOpen }: FilterProps) => {
  const { filters, setFilters } = useShiftStore();
  const selectedStatuses = filters.statuses.includes('all')
    ? []
    : filters.statuses.filter((status) => status !== 'all');

  const setAll = () => setFilters({ statuses: ['all'] });

  const toggleStatus = (status: Exclude<ShiftStatus, 'all'>) => {
    const next = selectedStatuses.includes(status)
      ? selectedStatuses.filter((item) => item !== status)
      : [...selectedStatuses, status];

    setFilters({ statuses: next.length ? next : ['all'] });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 min-w-40 items-center justify-between rounded-xl border border-gray-300 px-4 text-base font-semibold cursor-pointer text-gray-900"
      >
        <span>
          {selectedStatuses.length ? `Selected (${selectedStatuses.length})` : 'All Status'}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-20 w-80 rounded-xl border border-blue-100 bg-white p-3 shadow-xl">
          <button
            type="button"
            onClick={setAll}
            className={`mb-3 flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium ${
              selectedStatuses.length === 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-900'
            }`}
          >
            All Status
            {selectedStatuses.length === 0 && <Check className="h-4 w-4" />}
          </button>

          {selectedStatuses.length > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Selected ({selectedStatuses.length})
                </p>
                <button
                  type="button"
                  onClick={setAll}
                  className="text-sm font-medium text-blue-600"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1 border-b border-gray-200 pb-3">
                {selectedStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className="flex w-full items-center justify-between rounded-md bg-blue-100 px-4 py-3 text-left text-sm font-medium text-blue-700"
                  >
                    {titleCase(status)}
                    <Check className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="px-1 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Available Statuses
          </p>
          <div className="space-y-1">
            {STATUS_OPTIONS.filter((status) => !selectedStatuses.includes(status)).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className="flex w-full items-center justify-between rounded-md border border-gray-100 px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50"
              >
                {titleCase(status)}
                <span className="h-4 w-4 rounded border border-gray-200" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ShiftDashboardScreen = () => {
  const { toggleCreateModal, filters, setFilters } = useShiftStore();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'date' | 'createdBy' | 'status' | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-5 lg:p-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">Shifts</h1>
            <p className="mt-1 text-xs text-gray-500">Manage Shifts</p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={toggleCreateModal}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0658C2] px-5 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create New Shift
            </button>
          </div>
        </div>

     

        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row xl:items-center xl:justify-between">
          {/* Search */}
          <div className="relative  lg:max-w-[400px] max-w-full flex-1">
            <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="h-12 w-full rounded-lg border border-gray-300 px-6 pr-14 text-sm outline-none focus:border-[#0658C2]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-row flex-wrap gap-4 sm:flex-row" ref={filtersRef}>
            <DateFilter
              isOpen={activeFilter === 'date'}
              setIsOpen={(val) => setActiveFilter(val ? 'date' : null)}
            />
            <CreatedByFilter
              isOpen={activeFilter === 'createdBy'}
              setIsOpen={(val) => setActiveFilter(val ? 'createdBy' : null)}
            />
            <StatusFilter
              isOpen={activeFilter === 'status'}
              setIsOpen={(val) => setActiveFilter(val ? 'status' : null)}
            />
          </div>
        </div>
        <ShiftListScreen onSelectShift={setSelectedShiftId} />
      </div>

      <CreateShiftModal />
      <ShiftDetailsModal shiftId={selectedShiftId} onClose={() => setSelectedShiftId(null)} />
    </div>
  );
};

'use client';

import { ArrowLeft, Calendar, Check, ChevronDown, Clock3, Save, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const attendanceTypes = ['Manual Punch', 'Regularization', 'Missed Check-out', 'Overtime Adjustment'];

export function AddAttendanceScreen() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
        <div className="relative hidden w-full max-w-[310px] sm:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
          <input placeholder="Search anything..." className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold">Abhinav Barwal</p>
          <p className="text-xs text-[#676767]">Operations Head</p>
        </div>
      </header>

      <main className="p-5 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/attendance"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D3D3D3] bg-white text-[#0658C2] shadow-sm transition hover:bg-[#DBEAFF]"
              aria-label="Back to attendance"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-[28px] font-bold tracking-normal">Add Attendance</h1>
              <p className="mt-1 text-sm text-[#676767]">Create a manual attendance record for an employee.</p>
            </div>
          </div>
        </div>

        <form>
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <SectionTitle icon={UserRound} title="Attendance Details" />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <InputField label="Enter Employee Phone Number" required placeholder="Phone number or id" />
              <InputField label="Date" required placeholder="DD / MM / YYYY" icon={Calendar} />
              <InputField label="Check-in Time" required placeholder="EXP : 9 AM" icon={Clock3} />
              <InputField label="Check-out Time" required placeholder="EXP: 7PM" icon={Clock3} />
              <SelectField label="Attendance Type" required options={attendanceTypes} placeholder="Select attendance type" />
              <SelectField label="Status" required options={['On Time', 'Late', 'Half Day', 'Absent', 'Leave']} placeholder="Select status" />
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold">
                Reason <span className="text-[#F54A4A]">*</span>
              </span>
              <textarea
                placeholder="Reason for manual attendance"
                className="h-[150px] w-full resize-none rounded-lg border border-[#D3D3D3] px-4 py-4 text-sm outline-none focus:border-[#0658C2]"
              />
            </label>

            <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
              <Link
                href="/attendance"
                className="flex h-12 items-center justify-center rounded-xl border border-[#0658C2] px-10 font-semibold text-[#061A3D] transition hover:bg-[#DBEAFF] sm:min-w-[150px]"
              >
                Cancel
              </Link>
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-10 font-semibold text-white transition hover:bg-[#054A9F] sm:min-w-[190px]"
              >
                <Save className="h-4 w-4" />
                Save Attendance
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof UserRound; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold">
      <Icon className="h-5 w-5 text-[#0658C2]" />
      {title}
    </h2>
  );
}

function InputField({
  label,
  placeholder,
  required,
  icon: Icon,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  icon?: typeof Calendar;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      <span className="relative block">
        <input
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 pr-11 text-sm outline-none focus:border-[#0658C2]"
        />
        {Icon && <Icon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />}
      </span>
    </label>
  );
}

function SelectField({
  label,
  placeholder,
  required,
  options,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <label className="relative block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-100 bg-white px-4 text-left text-sm text-[#676767] outline-none transition focus:border-[#0658C2]"
      >
        <span className={selectedValue ? 'text-[#111827]' : ''}>{selectedValue || placeholder}</span>
        <ChevronDown className={`h-5 w-5 text-black transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-[260px] w-full overflow-y-auto rounded-lg border border-[#DBEAFF] bg-white p-2 shadow-xl">
          {options.map((option) => {
            const selected = selectedValue === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelectedValue(option);
                  setOpen(false);
                }}
                className={`group mb-1 flex w-full items-center justify-between rounded-md border border-gray-100 px-4 py-[9px] text-left text-sm transition last:mb-0 hover:border-transparent hover:bg-[#DBEAFF] ${
                  selected ? 'bg-[#DBEAFF] text-[#0658C2]' : 'text-[#111827]'
                }`}
              >
                {option}
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border group-hover:border-transparent group-hover:bg-white ${
                    selected ? 'border-transparent bg-white text-[#0658C2]' : 'border-[#D3D3D3]'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </label>
  );
}

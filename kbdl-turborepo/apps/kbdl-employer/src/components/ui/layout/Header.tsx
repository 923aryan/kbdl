import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100"
          >
            <Bell className="h-5 w-5 text-gray-500" />
          </button>

          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            8
          </span>
        </div>

        <div className="hidden h-10 w-px bg-gray-200 sm:block" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFF] text-xs font-bold text-[#0658C2]">
            KB
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Kaam Badlo</p>
            <p className="text-xs text-[#676767]">HRMS Portal</p>
          </div>
        </div>
      </div>
    </header>
  );
}
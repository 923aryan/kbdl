'use client';

import { useAuthStore } from '@/features/auth/stores/use-auth-store';
import {
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCheck,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/ui/layout/Header';

const menuItems = [
  {
    path: '/company',
    label: 'Company',
    icon: Building2,
    subItems: [
      { path: '/company', label: 'Details', icon: Building2 },
      { path: '/company/organization', label: 'Catalogs & locations', icon: Settings },
    ],
  },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/shifts', label: 'Shifts', icon: Clock },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  {
    path: '/payroll',
    label: 'Payroll',
    icon: WalletCards,
    subItems: [
      { path: '/payroll/run', label: 'Run Payroll', icon: Clock },
      { path: '/payroll/worker-wages', label: 'Worker Wages', icon: Users },
      { path: '/payroll/payslips', label: 'Payslips', icon: FileText },
      { path: '/payroll/statutory-filing', label: 'Statutory Filing', icon: ShieldCheck },
      { path: '/payroll/settings', label: 'Payroll Setting', icon: Settings },
    ],
  },
  {
    path: '/leave',
    label: 'Leave',
    icon: UserCheck,
    subItems: [
      { path: '/leave/types', label: 'Leave Types', icon: Settings },
      { path: '/leave/apply', label: 'Apply Leave', icon: Users },
      { path: '/leave/requests', label: 'Leaves Request', icon: Users },
    ],
  },
  {
    path: '/attendance',
    label: 'Attendance',
    icon: UserRoundCheck,
    subItems: [
      { path: '/attendance/add', label: 'Add Attendance', icon: Users },
      { path: '/attendance/analytics', label: 'Analytics', icon: FileText },
    ],
  },
];

function NavItem({
  item,
  pathname,
  setSidebarOpen,
}: {
  item: (typeof menuItems)[0];
  pathname: string;
  setSidebarOpen: (v: boolean) => void;
}) {
  const Icon = item.icon;
  const isExactActive = pathname === item.path;
  const isChildActive = item.subItems?.some((sub) => pathname === sub.path);
  const isSectionActive = item.path !== '/' && pathname.startsWith(item.path);
  const isActive = isExactActive || isChildActive;

  const [isOpen, setIsOpen] = useState(isActive);

  // Auto-open if a child becomes active
  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  // If it doesn't have subItems, render simple Link
  if (!item.subItems) {
    return (
      <Link
        href={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`
          mx-3 mb-2 flex h-11 items-center rounded-xl px-5 text-[15px] font-semibold transition-colors
          ${isExactActive || isSectionActive ? 'bg-[#DBEAFF] text-[#0658C2]' : 'text-[#0F172A] hover:bg-[#FAFAFA]'}
        `}
      >
        <Icon className="mr-4 h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  // If it has subItems, render accordion
  return (
    <div>
      <div
        className={`
          mx-3 mb-2 flex h-11 w-[calc(100%-24px)] items-center justify-between rounded-xl px-5 text-[15px] font-semibold transition-colors
          ${isActive || isSectionActive ? 'bg-[#DBEAFF] text-[#0658C2]' : 'text-[#0F172A] hover:bg-[#FAFAFA]'}
        `}
      >
        <Link
          href={item.path}
          onClick={() => {
            setIsOpen(true);
            setSidebarOpen(false);
          }}
          className="flex min-w-0 flex-1 items-center"
        >
          <Icon className="mr-4 h-5 w-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition hover:bg-white/70"
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label} menu`}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mx-5 mb-3 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
          {item.subItems.map((sub) => {
            const isSubActive = pathname === sub.path;
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.path}
                href={sub.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  mb-1 flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors last:mb-0
                  ${
                    isSubActive
                      ? 'bg-[#DBEAFF] text-[#0658C2]'
                      : 'text-[#111827] hover:bg-[#FAFAFA]'
                  }
                `}
              >
                <SubIcon className="mr-3 h-4 w-4" />
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Resize state
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  const employer = useAuthStore((state) => state.employer);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle redirect - ONLY redirect if we're sure there's no employer
  useEffect(() => {
    // Wait for hydration and client-side mount
    if (!isClient || !isHydrated) return;

    // If no employer, redirect to login
    if (!employer) {
      router.replace('/login');
      return;
    }
    const status = employer.status ?? (employer.is_verified ? 'active' : 'onboarding');
    if (employer.setup_pending || status === 'onboarding' || status === 'rejected') {
      if (!pathname.startsWith('/company')) router.replace('/company');
      return;
    }
    if (employer.role_code === 'OWNER' && (pathname === '/' || pathname === '')) {
      router.replace('/company');
    }
  }, [employer, isHydrated, isClient, router, pathname]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        let newWidth = mouseMoveEvent.clientX;
        if (newWidth < 120) {
          newWidth = 80; // Collapsed mode width
        } else if (newWidth > 400) {
          newWidth = 400; // Max width
        }
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Prevent text selection while resizing
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('select-none');
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.classList.remove('select-none');
      document.body.style.cursor = 'default';
    }
  }, [isResizing]);

  // Show loading while checking auth
  if (!isClient || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // If no employer, don't render dashboard (will redirect)
  if (!employer) {
    return null;
  }

  const isCollapsed = sidebarWidth === 80;
  const companyStatus = employer.status ?? (employer.is_verified ? 'active' : 'onboarding');
  const companyIsLive = companyStatus === 'active';
  const visibleMenu = companyIsLive ? menuItems : menuItems.filter((item) => item.path === '/company');

  return (
    <div 
      className="min-h-screen bg-gray-50" 
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-md shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 flex w-64 lg:w-[var(--sidebar-width)]
        `}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className={`border-b border-gray-100 px-6 py-3 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-center'} h-[92px]`}>
            {isCollapsed ? (
              <h1 className="text-xl font-bold text-[#0658C2]">KB</h1>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-black leading-7 text-[#092052]">K<span className="text-[#0658C2]">B</span></div>
                <h1 className="text-sm font-black tracking-wide text-[#092052]">KAAM <span className="text-[#0658C2]">BADLO</span></h1>
                <p className="text-xs text-[#676767]">Employer Portal</p>
              </div>
            )}
          </div>

          <nav className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
            {isCollapsed
              ? visibleMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path || item.subItems?.some((sub) => pathname === sub.path);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group relative flex items-center justify-center py-3 text-gray-700 hover:bg-gray-50 transition-colors
                        ${isActive ? 'bg-[#DBEAFF] text-[#0658C2]' : ''}
                      `}
                    >
                      <Icon className="w-5 h-5 shrink-0" />

                      <div className="absolute left-full ml-2 hidden rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100 whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    </Link>
                  );
                })
              : visibleMenu.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    pathname={pathname}
                    setSidebarOpen={setSidebarOpen}
                  />
                ))}
          </nav>

          {!isCollapsed && (
            <div className="mx-4 mb-3 rounded-xl bg-[#FAFAFA] p-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#DBEAFF] font-bold text-[#0658C2]">TI</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{employer?.company_name || 'Texo Industries Ltd.'}</p>
                  <p className="text-xs text-[#676767]">Delhi, Gujrat</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#676767]">
                <span className="capitalize">
                  Status: {companyStatus.replaceAll('_', ' ')}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${companyIsLive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
                />
              </div>
            </div>
          )}

          <div className="w-full p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={() => {
                // Clear auth storage and redirect to login
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('employer');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
              }}
              className={`
                group relative flex items-center py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full
                ${isCollapsed ? 'justify-center px-0' : 'px-4'}
              `}
            >
              <LogOut className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              
              {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-2 hidden rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100 whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className="hidden lg:block w-1.5 cursor-col-resize hover:bg-blue-500 active:bg-blue-500 transition-colors bg-transparent border-r border-gray-100 shrink-0 relative z-50"
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen lg:ml-[var(--sidebar-width)] transition-[margin] duration-300 ease-in-out">
        <Header/>
        {children}
      </div>
    </div>
  );
}

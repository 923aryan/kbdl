'use client';

import { useAuthStore } from '@/features/auth/stores/use-auth-store';
import {
  Briefcase,
  ChevronDown,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const menuItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/shifts', label: 'Shifts', icon: Clock },
  { path: '/employees', label: 'Employees', icon: Users },
  {
    path: '/jobs',
    label: 'Jobs',
    icon: Briefcase,
    subItems: [
      { path: '/jobs', label: 'All Jobs' },
      { path: '/jobs/create', label: 'Create Job' },
    ],
  },
  { path: '/dashboard/billing', label: 'Billing', icon: CreditCard },
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
          flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors
          ${isExactActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''}
        `}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span>{item.label}</span>
      </Link>
    );
  }

  // If it has subItems, render accordion
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors
          ${isActive && !isOpen ? 'bg-blue-50/30 text-blue-600' : ''}
        `}
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-3" />
          <span>{item.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="bg-gray-50/50 py-1 space-y-1">
          {item.subItems.map((sub) => {
            const isSubActive = pathname === sub.path;
            return (
              <Link
                key={sub.path}
                href={sub.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center pl-[52px] pr-6 py-2.5 text-sm transition-colors
                  ${
                    isSubActive
                      ? 'text-blue-600 font-medium border-r-4 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
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

  const { employer, isHydrated, hydrateAuth } = useAuthStore();

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Hydrate auth on mount (only once)
  useEffect(() => {
    if (!isHydrated) {
      hydrateAuth();
    }
  }, [isHydrated, hydrateAuth]);

  // Handle redirect - ONLY redirect if we're sure there's no employer
  useEffect(() => {
    // Wait for hydration and client-side mount
    if (!isClient || !isHydrated) return;

    // If no employer, redirect to login
    if (!employer) {
      console.log('No employer found, redirecting to login');
      router.replace('/login');
    }
  }, [employer, isHydrated, isClient, router]);

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
          <div className={`p-6 border-b border-gray-100 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : ''} h-[92px]`}>
            {isCollapsed ? (
              <h1 className="text-xl font-bold text-gray-800">K</h1>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">KBDL Employer</h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-gray-500 whitespace-nowrap truncate">Welcome, {employer?.company_name || 'Employer'}</p>
                </div>
              </div>
            )}
          </div>

          <nav className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center py-3 text-gray-700 hover:bg-gray-50 transition-colors
                    ${isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''}
                    ${isCollapsed ? 'justify-center px-0' : 'px-6'}
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 hidden rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

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
        {children}
      </div>
    </div>
  );
}

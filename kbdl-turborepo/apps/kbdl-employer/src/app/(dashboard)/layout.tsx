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
import { useEffect, useState } from 'react';

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

  return (
    <div className="min-h-screen bg-gray-50">
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
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">KBDL Employer</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-gray-500">Welcome, {employer?.company_name || 'Employer'}</p>
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              pathname={pathname}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => {
              // Clear auth storage and redirect to login
              localStorage.removeItem('auth-storage');
              localStorage.removeItem('employer');
              localStorage.removeItem('accessToken');
              window.location.href = '/login';
            }}
            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">{children}</div>
    </div>
  );
}

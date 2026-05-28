'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Users,
  CreditCard,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/use-auth-store';

const menuItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/shifts', label: 'Shifts', icon: Clock },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

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
            <p className="text-sm text-gray-500">
              Welcome, {employer?.company_name || employer?.name || 'Employer'}
            </p>
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''}
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
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

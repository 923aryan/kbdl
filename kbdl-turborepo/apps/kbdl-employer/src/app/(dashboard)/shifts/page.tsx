'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function ShiftsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <p className="text-gray-600 mt-1">Manage your shifts and replacements</p>
        </div>
        <Link
          href="/dashboard/shifts/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Shift
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">✅ Shifts page is working!</p>
        <p className="text-sm text-gray-400 mt-2">Click "Create Shift" to add new shifts</p>
      </div>
    </div>
  );
}

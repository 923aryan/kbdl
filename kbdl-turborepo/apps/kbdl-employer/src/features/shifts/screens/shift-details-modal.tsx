'use client';

import { X, CheckCircle, XCircle, User, Calendar, Clock, MapPin, DollarSign } from 'lucide-react';

interface ShiftDetailsModalProps {
  shiftId: string | null;
  onClose: () => void;
}

export const ShiftDetailsModal = ({ shiftId, onClose }: ShiftDetailsModalProps) => {
  if (!shiftId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Shift Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-gray-600 text-center">Shift details will appear here</p>
            <p className="text-sm text-gray-500 text-center mt-2">Shift ID: {shiftId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import { AlertCircle, X } from 'lucide-react';
import type { EmployerValidationError } from '../lib/onboard-error-messages';

type OnboardErrorModalProps = {
  open: boolean;
  title: string;
  errors: EmployerValidationError[];
  onClose: () => void;
};

export function OnboardErrorModal({ open, title, errors, onClose }: OnboardErrorModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-error-title"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#FEE9E5] bg-[#FFF7F6] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEE9E5]">
              <AlertCircle className="h-5 w-5 text-[#F54A4A]" />
            </div>
            <div>
              <h2 id="onboard-error-title" className="text-base font-bold text-[#B42318]">
                {title}
              </h2>
              <p className="mt-1 text-sm text-[#676767]">
                Update the highlighted details below and submit again.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-[#FEE9E5]">
            <X className="h-5 w-5 text-[#525252]" />
          </button>
        </div>

        <ul className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {errors.map((error, index) => (
            <li
              key={`${error.label}-${index}`}
              className="rounded-lg border border-[#FEE9E5] bg-[#FFFBFB] px-4 py-3"
            >
              <p className="text-sm font-semibold text-[#B42318]">{error.label}</p>
              <p className="mt-1 text-sm text-[#525252]">{error.message}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-[#EFEFEF] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl bg-[#0658C2] text-sm font-semibold text-white"
          >
            OK, I&apos;ll fix it
          </button>
        </div>
      </div>
    </div>
  );
}

'use client'; // Required if using Next.js App Router

import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { JSX } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = (): JSX.Element => {
  return (
    <SonnerToaster
      position="top-center"
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          // Base container for all toasts
          toast:
            'flex w-full items-center rounded-xl p-4 shadow-lg border max-w-[90vw] sm:max-w-[400px] transition-all',

          // Theme specific overrides
          error: 'bg-[#FFE5E5] border-[#FF4D4F] text-[#374151]',
          success: 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]',
          info: 'bg-[#EFF6FF] border-[#3B82F6] text-[#1E3A8A]',

          // Text and Layout spacing
          title: 'text-[15px] leading-[22px] font-medium flex-1 pr-8',
          description: 'text-sm opacity-90 mt-1',
          icon: 'mr-3 flex-shrink-0',

          // Close button positioned on the far right
          closeButton:
            'absolute right-4 top-1/2 -translate-y-1/2 text-current hover:opacity-70 transition-opacity p-1 cursor-pointer',
        },
      }}
      icons={{
        error: <TriangleAlert size={28} color="#F43F5E" />,
        success: <CheckCircle2 size={28} color="#10B981" />,
        info: <Info size={28} color="#3B82F6" />,
      }}
    />
  );
};

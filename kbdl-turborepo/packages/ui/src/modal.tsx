import { X } from 'lucide-react';
import * as React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className = '' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`relative w-full max-w-md rounded-xl bg-card border border-border shadow-xl ${className}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1 hover:bg-surface text-icon transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 text-text">{children}</div>
      </div>
    </div>
  );
};

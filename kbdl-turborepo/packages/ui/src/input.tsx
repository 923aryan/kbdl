import type { InputHTMLAttributes, JSX } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The visual style of the input.
   * @default "outline"
   */
  variant?: 'outline' | 'filled';
  /**
   * Optional size adjustments.
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * Optional label text to display above the input.
   */
  label?: string;
  /**
   * Optional error message. Triggers red border/text if provided.
   */
  error?: string;
  /**
   * Optional helper text displayed below the input.
   */
  helperText?: string;
}

export const Input = ({
  variant = 'outline',
  size = 'default',
  label,
  error,
  helperText,
  className = '',
  id,
  disabled,
  ...props
}: InputProps): JSX.Element => {
  // 1. Base classes that apply to EVERY input
  const baseClasses =
    'w-full font-sans text-text placeholder:text-text-secondary rounded-xl transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  // 2. Variant specific classes mapped to your Tailwind v4 theme variables
  const variantClasses = {
    outline:
      'bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary',
    filled:
      'bg-surface border border-transparent focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary',
  };

  // 3. Size specific classes
  const sizeClasses = {
    default: 'px-4 py-3 text-base',
    sm: 'px-3 py-2 text-sm',
    lg: 'px-5 py-4 text-lg',
  };

  // 4. Error state overrides
  const errorClasses = error
    ? '!border-red-500 focus:!ring-red-500 focus:!border-red-500' // Using ! to override normal focus states
    : '';

  // Combine them safely
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${errorClasses} ${className}`;

  // Generate a fallback ID for the label/input association if one isn't provided
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {/* Optional Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>
      )}

      {/* The Actual Input */}
      <input
        id={inputId}
        className={combinedClasses}
        disabled={disabled}
        {...props}
      />

      {/* Helper Text or Error Message */}
      {(error || helperText) && (
        <span
          className={`text-sm ${error ? 'text-red-500' : 'text-text-secondary'
            }`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
};
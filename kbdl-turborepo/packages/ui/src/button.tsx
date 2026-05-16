import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /**
   * The visual style of the button.
   * @default "primary"
   */
  variant?: 'primary' | 'outline';
  /**
   * Optional size adjustments.
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  disabled,
  ...props
}: ButtonProps): JSX.Element => {
  // 1. Base classes that apply to EVERY button
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  // 2. Variant specific classes mapped to your Tailwind v4 theme variables
  const variantClasses = {
    primary: 'bg-primary text-white shadow-sm hover:opacity-90',
    outline:
      'bg-transparent border border-navy text-navy hover:bg-surface dark:border-border dark:text-text',
  };

  // 3. Size specific classes
  const sizeClasses = {
    default: 'px-6 py-3 text-base',
    sm: 'px-4 py-2 text-sm',
    lg: 'px-8 py-4 text-lg',
  };

  // Combine them safely
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

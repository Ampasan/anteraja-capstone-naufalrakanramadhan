import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline-magenta';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#C91076] text-white border border-[#C91076] hover:bg-[#E51A8A] hover:border-[#E51A8A] active:bg-[#A00060] shadow-sm',
  secondary:
    'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] shadow-sm',
  ghost:
    'bg-transparent text-[#475569] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A]',
  destructive:
    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300',
  'outline-magenta':
    'bg-transparent text-[#C91076] border border-[#C91076] hover:bg-[#FFF0F6] active:bg-[#FFE0F0]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

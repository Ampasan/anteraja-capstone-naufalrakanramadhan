import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightElement, className, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:ring-offset-0 focus:border-[#C91076]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon ? 'pl-9' : 'pl-3',
            rightElement ? 'pr-9' : 'pr-3',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 text-[#94A3B8] flex items-center">
            {rightElement}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

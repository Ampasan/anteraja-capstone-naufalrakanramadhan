import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'online'
  | 'idle'
  | 'alert'
  | 'offline'
  | 'selected'
  | 'same-day'
  | 'frozen'
  | 'pharma'
  | 'regular'
  | 'terbaik'
  | 'live-tracking'
  | 'darurat'
  | 'suhu';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  online:        'bg-emerald-50 text-emerald-700 border border-emerald-200',
  idle:          'bg-amber-50 text-amber-700 border border-amber-200',
  alert:         'bg-red-50 text-red-600 border border-red-200',
  offline:       'bg-slate-100 text-slate-500 border border-slate-200',
  selected:      'bg-[#C91076] text-white border border-[#C91076]',
  'same-day':    'bg-[#FFF0F6] text-[#C91076] border border-[#F9A8D4]',
  frozen:        'bg-blue-50 text-blue-700 border border-blue-200',
  pharma:        'bg-purple-50 text-purple-700 border border-purple-200',
  regular:       'bg-slate-50 text-slate-600 border border-slate-200',
  terbaik:       'bg-teal-50 text-teal-700 border border-teal-200',
  'live-tracking': 'bg-[#C91076] text-white border border-[#C91076]',
  darurat:       'bg-red-50 text-red-700 border border-red-300',
  suhu:          'bg-orange-50 text-orange-700 border border-orange-200',
};

const dotColors: Record<BadgeVariant, string> = {
  online:        'bg-emerald-500',
  idle:          'bg-amber-500',
  alert:         'bg-red-500',
  offline:       'bg-slate-400',
  selected:      'bg-white',
  'same-day':    'bg-[#C91076]',
  frozen:        'bg-blue-500',
  pharma:        'bg-purple-500',
  regular:       'bg-slate-400',
  terbaik:       'bg-teal-500',
  'live-tracking': 'bg-white',
  darurat:       'bg-red-500',
  suhu:          'bg-orange-500',
};

export function Badge({ variant = 'regular', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold leading-none uppercase tracking-wide whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}

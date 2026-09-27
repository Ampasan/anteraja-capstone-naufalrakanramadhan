import { AlertTriangle, Hourglass, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SlaSummary } from '../types';

interface SlaSummaryCardsProps {
  summary: SlaSummary;
}

export function SlaSummaryCards({ summary }: SlaSummaryCardsProps) {
  const cards = [
    {
      risk: 'Kritis' as const,
      label: 'Kritis',
      timeHint: '< 15 menit tersisa',
      description: 'Perlu tindakan segera',
      count: summary.kritis,
      Icon: AlertTriangle,
      // styling
      border:    'border-red-200',
      topBar:    'bg-red-500',
      dotCls:    'bg-red-500 animate-pulse-ring',
      labelCls:  'text-red-600',
      hintCls:   'text-red-400 bg-red-50 border-red-100',
      descCls:   'text-red-500',
      iconBg:    'bg-red-50',
      iconCls:   'text-red-400',
      countCls:  'text-red-600',
      stagger:   'stagger-1',
    },
    {
      risk: 'Waspada' as const,
      label: 'Waspada',
      timeHint: '15 – 30 menit tersisa',
      description: 'Pantau & siapkan tindakan',
      count: summary.waspada,
      Icon: Hourglass,
      border:    'border-amber-200',
      topBar:    'bg-amber-400',
      dotCls:    'bg-amber-400',
      labelCls:  'text-amber-600',
      hintCls:   'text-amber-600 bg-amber-50 border-amber-100',
      descCls:   'text-amber-500',
      iconBg:    'bg-amber-50',
      iconCls:   'text-amber-300',
      countCls:  'text-amber-600',
      stagger:   'stagger-2',
    },
    {
      risk: 'Aman' as const,
      label: 'Aman',
      timeHint: '> 30 menit tersisa',
      description: 'Pengiriman berjalan normal',
      count: summary.aman,
      Icon: CheckCircle2,
      border:    'border-emerald-200',
      topBar:    'bg-emerald-500',
      dotCls:    'bg-emerald-500',
      labelCls:  'text-emerald-700',
      hintCls:   'text-emerald-700 bg-emerald-50 border-emerald-100',
      descCls:   'text-emerald-600',
      iconBg:    'bg-emerald-50',
      iconCls:   'text-emerald-300',
      countCls:  'text-emerald-700',
      stagger:   'stagger-3',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.risk}
          className={cn(
            'animate-fade-up bg-white rounded-xl border overflow-hidden',
            'shadow-[0_1px_3px_0_rgba(15,23,42,0.06)]',
            'hover:shadow-[0_4px_12px_0_rgba(15,23,42,0.10)] hover:-translate-y-0.5',
            'transition-all duration-200 ease-out cursor-default',
            card.border,
            card.stagger,
          )}
        >
          {/* Colored top bar — visual risk level indicator */}
          <div className={cn('h-1 w-full', card.topBar)} />

          <div className="p-5 flex items-start justify-between gap-3">
            {/* Left */}
            <div className="flex flex-col gap-3 min-w-0">
              {/* Status pill */}
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', card.dotCls)} />
                <span className={cn('text-xs font-black uppercase tracking-widest', card.labelCls)}>
                  {card.label}
                </span>
              </div>

              {/* Big count */}
              <div className="flex items-baseline gap-2">
                <span className={cn('text-5xl font-black leading-none tabular-nums animate-pop-in', card.countCls, card.stagger)}>
                  {card.count}
                </span>
                <span className="text-base font-semibold text-[#64748B]">Paket</span>
              </div>

              {/* Time hint pill */}
              <span className={cn('self-start inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border', card.hintCls)}>
                {card.timeHint}
              </span>

              {/* Helper description */}
              <p className={cn('text-xs font-medium', card.descCls)}>
                {card.description}
              </p>
            </div>

            {/* Right — decorative icon */}
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0', card.iconBg)}>
              <card.Icon size={28} className={card.iconCls} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

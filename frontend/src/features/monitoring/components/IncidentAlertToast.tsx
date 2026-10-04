import { X, AlertTriangle, Snowflake, Wrench, CloudRain, Package, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { IncidentAlert } from '../types';

interface IncidentAlertToastProps {
  incident: IncidentAlert;
  onReassign?: () => void;
  onDismiss: () => void;
}

const ICON_MAP = {
  'snowflake': Snowflake,
  'wrench': Wrench,
  'cloud-rain': CloudRain,
  'alert-triangle': AlertTriangle,
  'package': Package,
  'map-pin': MapPin,
};

export function IncidentAlertToast({
  incident,
  onReassign,
  onDismiss,
}: IncidentAlertToastProps) {
  const IconComponent = ICON_MAP[incident.icon];
  const isCritical = incident.severity === 'CRITICAL';

  return (
    <div className={cn(
      'animate-toast-in fixed bottom-5 right-4 sm:right-5 z-[600] w-[min(380px,calc(100vw-2rem))] bg-white rounded-xl border-2 shadow-[0_8px_24px_rgba(15,23,42,0.18)] overflow-hidden pointer-events-auto',
      incident.theme.border,
    )}>

      {/* Coloured top accent strip */}
      <div className={cn('h-1.5', incident.theme.accent)} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3.5">
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
            incident.theme.iconBg,
          )}>
            <IconComponent size={20} className={incident.theme.iconColor} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border',
                incident.theme.badge,
              )}>
                {incident.title}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8]">{incident.timestamp}</span>
            </div>
            {/* Body */}
            <p className="text-[12px] text-[#475569] leading-relaxed">
              Resi{' '}
              <span className="font-mono font-bold text-[#C91076]">{incident.waybillNumber}</span>
              {' '}
              {incident.description}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
            aria-label="Abaikan"
          >
            <X size={14} />
          </button>
        </div>

        {/* Courier info */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
            isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
          )}>
            {incident.courierName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-[#0F172A] truncate">{incident.courierName}</p>
            <p className="text-[10px] text-[#64748B] truncate">{incident.location}</p>
          </div>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
            isCritical
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}>
            {incident.severity}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {onReassign && (
            <Button
              variant="primary"
              size="sm"
              onClick={onReassign}
              className="w-full text-[13px] font-bold"
            >
              <ArrowRight size={13} />
              Alihkan Paket
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onDismiss}
            className="w-full text-[12px]"
          >
            Abaikan
          </Button>
        </div>
      </div>
    </div>
  );
}

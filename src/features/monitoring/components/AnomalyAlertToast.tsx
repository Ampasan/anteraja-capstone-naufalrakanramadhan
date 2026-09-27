import { Thermometer, X, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ColdChainAnomaly } from '../types';

interface AnomalyAlertToastProps {
  anomaly: ColdChainAnomaly;
  onReassign: () => void;
  onDismiss: () => void;
}

export function AnomalyAlertToast({ anomaly, onReassign, onDismiss }: AnomalyAlertToastProps) {
  return (
    <div className="absolute bottom-12 right-4 z-[500] w-[340px] bg-white rounded-xl border border-orange-300 shadow-[0_8px_24px_rgba(15,23,42,0.18)] overflow-hidden pointer-events-auto">

      {/* Coloured top accent strip */}
      <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3.5">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Thermometer size={18} className="text-orange-600" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-[13px] font-bold text-[#0F172A]">
                ANOMALI SUHU COLD-CHAIN:
              </span>
              <span className="text-[13px] font-extrabold text-red-600">{anomaly.currentTempC}°C</span>
              <span className="text-[11px] font-medium text-[#94A3B8]">{anomaly.detectedAt}</span>
            </div>
            {/* Body */}
            <p className="text-[12px] text-[#475569] leading-relaxed">
              Resi{' '}
              <span className="font-mono font-bold text-[#C91076]">{anomaly.waybillNumber}</span>{' '}
              melebihi batas aman frozen food (maks.{' '}
              <span className="font-bold text-[#0F172A]">{anomaly.maxAllowedTempC}°C</span>).
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

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onReassign}
            className="flex-1 text-[13px] font-bold"
          >
            <Thermometer size={13} />
            Alihkan Paket
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDismiss}
            className="text-[13px]"
          >
            Abaikan
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Building2, ChevronDown } from 'lucide-react';
import { mockHubs } from '../../../data/mockHubs';

interface HubSelectProps {
  value: string;
  onChange: (hubId: string) => void;
}

export function HubSelect({ value, onChange }: HubSelectProps) {
  return (
    <div className="relative flex items-center w-full">
      {/* Icon gedung di kiri */}
      <span className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center z-10">
        <Building2 size={16} />
      </span>

      {/* Native select — distyling agar tampil custom */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pilih stasiun layanan"
        className="
          w-full h-10 bg-white border border-[#E2E8F0] rounded-lg
          text-sm text-[#0F172A] pl-9 pr-9
          appearance-none cursor-pointer
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:ring-offset-0 focus:border-[#C91076]
          hover:border-[#CBD5E1]
        "
      >
        {mockHubs.map((hub) => (
          <option key={hub.id} value={hub.id}>
            {hub.name}
          </option>
        ))}
      </select>

      {/* Icon panah ke bawah di kanan */}
      <span className="absolute right-3 text-[#94A3B8] pointer-events-none flex items-center">
        <ChevronDown size={16} />
      </span>
    </div>
  );
}

/** Tingkat keparahan insiden */
export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'SAFE';

/** Status penanganan insiden */
export type IncidentStatusType = 'PENDING' | 'REVIEWING' | 'REASSIGNED' | 'RESOLVED';

/** Jenis layanan pengiriman */
export type ServiceType =
  | 'Instant'
  | 'Same Day'
  | 'Next Day'
  | 'Regular'
  | 'Dokumen'
  | 'Cargo'
  | 'Mini Cargo'
  | 'PHARMA'
  | 'Frozen';

/** Tab filter status */
export type StatusFilterTab = 'Semua' | 'Kritis' | 'Waspada' | 'Aman';

/** Profil kurir yang terlibat dalam insiden */
export interface CourierProfile {
  id: string;
  name: string;
  vehicleType: string;
  vehiclePlate: string;
  phone: string;
}

/** Kandidat kurir pengganti untuk pengalihan tugas */
export interface CandidateCourier {
  id: string;
  name: string;
  initials: string;
  vehicleType: string;
  vehiclePlate: string;
  distanceM: number;
  etaMinutes: number;
  remainingCapacityKg: number;
  isRecommended: boolean;
  badge: string;
}

/** Laporan insiden lapangan lengkap */
export interface IncidentReport {
  id: string;
  severity: SeverityLevel;
  status: IncidentStatusType;
  waybillNumber: string;
  serviceType: ServiceType;
  serviceLabel: string;
  courier: CourierProfile;
  kendala: string;
  kendalaDetail?: string;
  stoppedLocation: string;
  destination: string;
  muatan: string;
  weightKg: number;
  reportedAt: string;
  statusLabel: string;
  candidates: CandidateCourier[];
}

/** Payload yang dikirim saat konfirmasi pengalihan */
export interface ReassignmentPayload {
  incidentId: string;
  waybillNumber: string;
  originalCourier: CourierProfile;
  selectedCandidate: CandidateCourier;
  confirmedAt: string;
}

/** State filter untuk halaman insiden */
export interface IncidentFilters {
  search: string;
  statusTab: StatusFilterTab;
  serviceType: ServiceType | 'Semua';
}

/** KPI ringkasan insiden untuk summary cards */
export interface IncidentKpiSummary {
  critical: number;
  warning: number;
  safePercent: number;
}

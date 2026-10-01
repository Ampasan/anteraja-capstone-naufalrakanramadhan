  /** Tingkat keparahan insiden */
export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'SAFE';

/** Status penanganan insiden.
 *  Pilihan REPORTED/ACKNOWLEDGED/REASSIGNING/ESCALATED/RESOLVED dipakai backend,
 *  PENDING/REVIEWING/REASSIGNED dipertahankan untuk kompatibilitas UI lama. */
export type IncidentStatusType =
  | 'PENDING'
  | 'REVIEWING'
  | 'REASSIGNED'
  | 'RESOLVED'
  | 'REPORTED'
  | 'ACKNOWLEDGED'
  | 'REASSIGNING'
  | 'ESCALATED';

/** Jenis layanan pengiriman. Backend mengirim label bebas ("Instant", "Cargo", ...). */
export type ServiceType = string;

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
  /** Beban paket saat ini / kapasitas maksimal (untuk bar muatan). */
  currentParcels?: number;
  maxParcels?: number;
}

/** Laporan insiden lapangan lengkap */
export interface IncidentReport {
  id: string;
  /** Kode insiden yang dibaca operator (mis. INC-HLM-082). */
  incidentCode?: string;
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
  evidenceImageUrl?: string;
  evidencePublicId?: string;
  evidenceCaption?: string;
  candidates: CandidateCourier[];
  /** Tambahan konteks dari API (opsional). */
  incidentCategory?: string;
  weatherCondition?: string;
  trafficCondition?: string;
  temperatureC?: number;
  latitude?: number;
  longitude?: number;
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

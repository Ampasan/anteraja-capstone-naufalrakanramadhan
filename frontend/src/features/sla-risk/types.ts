/** Jenis layanan pengiriman. Backend mengirim label bebas ("Instant", "Cargo", ...). */
export type ServiceType = string;

export type SlaRisk = string;

/** Kode kondisi perjalanan — backend mengirim slug bebas, jadi disimpan sebagai string. */
export type ConditionKey = string;

export interface OrderCondition {
  key: ConditionKey;
  label: string;
}

export type TimelineStatus = 'done' | 'pending' | 'late';

export interface TimelineStep {
  status: TimelineStatus;
  title: string;
  subtitle: string;
  time: string;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'red';
  etaBadge?: string;
}

export interface HazardAnalysis {
  weather: string;
  traffic: string;
  trafficColor: 'green' | 'amber' | 'red';
  slaRiskScore: number;
  slaRiskLabel: string;
  slaRiskColor: 'green' | 'amber' | 'red';
}

export interface CargoDetail {
  courierId: string;
  vehicleType: string;
  loadUsedKg: number;
  loadCapacityKg: number;
  loadKnown?: boolean;
  destinationName: string;
  destinationAddress: string;
  weightKg: number;
  dimensionCm?: string;
  volumeCbm?: string;
  cargoClassification: string;
  recipientName?: string;
  recipientPhone?: string;
  orderTime?: string;
  timeline: TimelineStep[];
  hazard: HazardAnalysis;
}

export interface SlaOrder {
  waybillNumber: string;
  courierId: string;
  serviceType: ServiceType;
  weightKg: number;
  slaDeadline: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'REASSIGNED';
  originLat: number;
  originLng: number;
  dropLat: number;
  dropLng: number;
  destinationName: string;
  destinationArea: string;
  condition: OrderCondition;
  slaRemainingMin: number;
  slaRisk: SlaRisk;
  detail: CargoDetail;
}

// ─── Filter ───
/** "Semua" | any SlaRisk level */
export type RiskFilter = 'Semua' | 'Kritis' | 'Waspada' | 'Aman';

/** "Semua" | any ServiceType pill */
export type ServiceFilter = 'Semua' | 'Instant' | 'Same Day' | 'Next Day' | 'Regular' | 'Dokumen' | 'Cargo' | 'Mini Cargo' | 'PHARMA' | 'Frozen';

// ─── Summary counts ──
export interface SlaSummary {
  kritis: number;
  waspada: number;
  aman: number;
  total: number;
}

// ─── Service pill definition ──
export interface ServicePill {
  key: ServiceFilter;
  label: string;
  count: number;
}

// ─── Pagination ────
export interface PaginationState {
  page: number;
  pageSize: number;
}

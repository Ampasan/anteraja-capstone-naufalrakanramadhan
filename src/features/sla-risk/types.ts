export type {
  SlaOrder,
  ServiceType,
  SlaRisk,
  OrderCondition,
  ConditionKey,
  CargoDetail,
  TimelineStep,
  TimelineStatus,
  HazardAnalysis,
} from '../../data/mockOrders';

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

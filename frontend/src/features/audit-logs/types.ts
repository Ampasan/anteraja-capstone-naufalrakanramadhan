export type { AuditLogEntry, AuditKpi, ServiceType, IncidentCategory } from '../../data/mockAuditLogs';


/** Rentang waktu yang dipilih pada tab filter tanggal */
export type DateFilterType = 'all' | 'today' | '7days' | 'month';

/** Kategori kendala yang dipilih pada pills filter */
export type CategoryFilterType =
  | 'all'
  | 'Cuaca / Hujan'
  | 'Anomali Suhu'
  | 'Mogok Kendaraan'
  | 'Ban Bocor'
  | 'Banjir';

/** Seluruh state filter yang dikelola oleh useAuditLogs */
export interface AuditFilters {
  search: string;
  dateFilter: DateFilterType;
  categoryFilter: CategoryFilterType;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CategoryCount {
  label: string;
  key: CategoryFilterType;
  count: number;
}

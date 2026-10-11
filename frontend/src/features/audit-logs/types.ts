export type ServiceType = string;
/** Kategori kendala. Backend mengirim string bebas  */
export type IncidentCategory = string;

interface AuditLogBase {
  id: string;
  logCode?: string;
  resi: string;
  serviceType: ServiceType;
  completedAt: string;
  fromCourier: string;
  fromCourierCode: string;
  toCourier: string;
  toCourierCode: string;
  incidentCategory: IncidentCategory;
  incidentDetail: string;
  handlingSeconds: number;
  slaCompliant: boolean;
  executorName?: string;
  evidenceImageUrl: string;
  evidencePublicId?: string;
  evidenceCaption?: string;
}

export interface AuditKpi {
  totalCompleted: number;
  avgHandlingSeconds: number;
  slaComplianceRate: number;
  slaCompliantCount: number;
}

/**
 * Posisi laporan pada satu baris riwayat.
 *
 * - `Dialihkan` — pengalihan baru saja dijalankan (hari operasional berjalan)
 * - `Eskalasi` — lapornya masih menuntut tindakan Admin Hub
 * - `Selesai` — kiriman sudah sampai ke penerima
 */
export type ReportStatus = 'Dialihkan' | 'Eskalasi' | 'Selesai';

export type AuditLogEntry = AuditLogBase & {
  reportStatus: ReportStatus;
};


/** Rentang waktu yang dipilih pada tab filter tanggal */
export type DateFilterType = 'all' | 'today' | '7days' | 'month';

/** Kategori kendala yang dipilih pada pills filter. */
export type CategoryFilterType =
  | 'all'
  | 'Cuaca / Hujan'
  | 'Anomali Suhu'
  | 'Mogok Kendaraan'
  | 'Ban Bocor'
  | 'Alamat tidak ditemukan'
  | 'Banjir'
  | 'Macet Total';

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

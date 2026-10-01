export type ServiceType = string;
/** Kategori kendala. Backend mengirim string bebas — pemetaan tampilan
 *  ditangani `incidentCfg()` dengan cabang default. */
export type IncidentCategory = string;

export interface AuditLogEntry {
  id: string;
  /** Kode log audit (mis. AUD-HLM-2026-0104). */
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
  /** Nama admin yang menjalankan pengalihan. */
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

export const EVIDENCE_MAP: Record<
  IncidentCategory,
  { url: string; publicId: string; caption: string }
> = {
  'Cuaca / Hujan': {
    url: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
    publicId: 'foto_bukti/inc-hlm-077-cuaca-hujan',
    caption: 'Genangan banjir setinggi 40cm di jalan alternatif akibat hujan lebat',
  },
  'Banjir': {
    url: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
    publicId: 'foto_bukti/inc-hlm-077-cuaca-hujan',
    caption: 'Genangan banjir memutus akses rute jalan, butuh pengalihan segera',
  },
  'Anomali Suhu': {
    url: '',
    publicId: '',
    caption: '',
  },
  'Mogok Kendaraan': {
    url: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
    publicId: 'foto_bukti/inc-hlm-082-kopling-rusak',
    caption: 'Foto kabel kopling truk putus di Jl. Panjang',
  },
  'Ban Bocor': {
    url: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
    publicId: 'foto_bukti/inc-hlm-082-kopling-rusak',
    caption: 'Kendala ban kendaraan di lokasi pengantaran',
  },
};

const PINNED_ROWS: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    resi: '100024000104',
    serviceType: 'NEXT DAY',
    completedAt: '2026-09-24T14:15:00',
    fromCourier: 'Indra Gunawan',
    fromCourierCode: 'SATRIA-004',
    toCourier: 'Eko Prasetyo',
    toCourierCode: 'SATRIA-004',
    incidentCategory: 'Cuaca / Hujan',
    incidentDetail: 'Cuaca: Hujan Lebat & Macet',
    handlingSeconds: 12,
    slaCompliant: true,
    evidenceImageUrl: EVIDENCE_MAP['Cuaca / Hujan'].url,
    evidencePublicId: EVIDENCE_MAP['Cuaca / Hujan'].publicId,
    evidenceCaption: EVIDENCE_MAP['Cuaca / Hujan'].caption,
  },
  {
    id: 'AUD-002',
    resi: '100024000107',
    serviceType: 'FROZEN',
    completedAt: '2026-09-24T13:42:00',
    fromCourier: 'Surya Darma',
    fromCourierCode: 'SATRIA-007',
    toCourier: 'Budi Santoso',
    toCourierCode: 'SATRIA-004',
    incidentCategory: 'Anomali Suhu',
    incidentDetail: 'Anomali Suhu 6.2°C',
    handlingSeconds: 18,
    slaCompliant: true,
    evidenceImageUrl: '',
  },
  {
    id: 'AUD-003',
    resi: '100024000012',
    serviceType: 'CARGO',
    completedAt: '2026-09-24T11:05:00',
    fromCourier: 'Teguh Wibowo',
    fromCourierCode: 'SATRIA-VAN-02',
    toCourier: 'Fajar Ramadhan',
    toCourierCode: 'SATRIA-004',
    incidentCategory: 'Mogok Kendaraan',
    incidentDetail: 'Kopling Jebol / Mogok',
    handlingSeconds: 22,
    slaCompliant: true,
    evidenceImageUrl: EVIDENCE_MAP['Mogok Kendaraan'].url,
    evidencePublicId: EVIDENCE_MAP['Mogok Kendaraan'].publicId,
    evidenceCaption: EVIDENCE_MAP['Mogok Kendaraan'].caption,
  },
  {
    id: 'AUD-004',
    resi: '100024000015',
    serviceType: 'PHARMA',
    completedAt: '2026-09-24T09:18:00',
    fromCourier: 'Budi Santoso',
    fromCourierCode: 'SATRIA-001',
    toCourier: 'Dimas Prasetyo',
    toCourierCode: 'SATRIA-004',
    incidentCategory: 'Ban Bocor',
    incidentDetail: 'Ban Belakang Pecah',
    handlingSeconds: 15,
    slaCompliant: true,
    evidenceImageUrl: EVIDENCE_MAP['Ban Bocor'].url,
    evidencePublicId: EVIDENCE_MAP['Ban Bocor'].publicId,
    evidenceCaption: EVIDENCE_MAP['Ban Bocor'].caption,
  },
  {
    id: 'AUD-005',
    resi: '100024000088',
    serviceType: 'SAME DAY',
    completedAt: '2026-09-24T08:44:00',
    fromCourier: 'Hendra Wijaya',
    fromCourierCode: 'SATRIA-018',
    toCourier: 'Rahmat Hidayat',
    toCourierCode: 'SATRIA-004',
    incidentCategory: 'Banjir',
    incidentDetail: 'Banjir Underpass Tebet',
    handlingSeconds: 20,
    slaCompliant: true,
    evidenceImageUrl: EVIDENCE_MAP['Banjir'].url,
    evidencePublicId: EVIDENCE_MAP['Banjir'].publicId,
    evidenceCaption: EVIDENCE_MAP['Banjir'].caption,
  },
];

const COURIERS = [
  { name: 'Andi Wijaya',     code: 'SATRIA-002' },
  { name: 'Bayu Nugroho',    code: 'SATRIA-003' },
  { name: 'Cecep Suherman',  code: 'SATRIA-005' },
  { name: 'Dedi Kurniawan',  code: 'SATRIA-006' },
  { name: 'Eko Prasetyo',    code: 'SATRIA-008' },
  { name: 'Faisal Arifin',   code: 'SATRIA-009' },
  { name: 'Gilang Santoso',  code: 'SATRIA-010' },
  { name: 'Hadi Purnomo',    code: 'SATRIA-011' },
  { name: 'Irwan Setiawan',  code: 'SATRIA-012' },
  { name: 'Joko Susilo',     code: 'SATRIA-013' },
  { name: 'Kemal Firdaus',   code: 'SATRIA-014' },
  { name: 'Lukman Hakim',    code: 'SATRIA-015' },
  { name: 'Muhamad Ridwan',  code: 'SATRIA-016' },
  { name: 'Nanang Wahyu',    code: 'SATRIA-017' },
  { name: 'Oscar Hidayat',   code: 'SATRIA-019' },
  { name: 'Pandu Wicaksono', code: 'SATRIA-020' },
  { name: 'Qori Ramadhan',   code: 'SATRIA-021' },
  { name: 'Rizky Putra',     code: 'SATRIA-022' },
];

const REPLACEMENTS = [
  { name: 'Rahmat Hidayat',  code: 'SATRIA-004' },
  { name: 'Eko Prasetyo',    code: 'SATRIA-008' },
  { name: 'Fajar Ramadhan',  code: 'SATRIA-VAN-02' },
  { name: 'Dimas Prasetyo',  code: 'SATRIA-014' },
  { name: 'Budi Santoso',    code: 'SATRIA-001' },
];

const INCIDENT_POOL: Array<{ category: IncidentCategory; detail: string }> = [
  { category: 'Cuaca / Hujan',    detail: 'Cuaca: Hujan Lebat & Macet' },
  { category: 'Cuaca / Hujan',    detail: 'Cuaca: Hujan Deras, Jalan Licin' },
  { category: 'Cuaca / Hujan',    detail: 'Cuaca: Angin Kencang & Hujan' },
  { category: 'Anomali Suhu',     detail: 'Anomali Suhu 6.2°C' },
  { category: 'Anomali Suhu',     detail: 'Anomali Suhu 7.1°C' },
  { category: 'Anomali Suhu',     detail: 'Anomali Suhu 5.8°C' },
  { category: 'Mogok Kendaraan',  detail: 'Kopling Jebol / Mogok' },
  { category: 'Mogok Kendaraan',  detail: 'Mesin Overheat' },
  { category: 'Mogok Kendaraan',  detail: 'Aki Soak, Kendaraan Tidak Bisa Nyala' },
  { category: 'Ban Bocor',        detail: 'Ban Belakang Pecah' },
  { category: 'Ban Bocor',        detail: 'Ban Depan Bocor' },
  { category: 'Banjir',           detail: 'Banjir Underpass Tebet' },
  { category: 'Banjir',           detail: 'Banjir Jl. MT Haryono' },
  { category: 'Cuaca / Hujan',    detail: 'Cuaca: Hujan Lebat & Banjir Lokal' },
  { category: 'Mogok Kendaraan',  detail: 'Transmisi Rusak / Mogok' },
];

const SERVICE_TYPES: ServiceType[] = ['NEXT DAY', 'FROZEN', 'CARGO', 'PHARMA', 'SAME DAY'];

const CATEGORY_DIST: IncidentCategory[] = [
  ...Array(48).fill('Cuaca / Hujan'),
  ...Array(26).fill('Anomali Suhu'),
  ...Array(34).fill('Mogok Kendaraan'),
  ...Array(12).fill('Ban Bocor'),
  ...Array(22).fill('Banjir'),
];

function seedRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateBulkRows(): AuditLogEntry[] {
  const rand = seedRand(42);
  const rows: AuditLogEntry[] = [];
  const baseMs = new Date('2026-09-24T08:00:00').getTime();

  for (let i = 6; i <= 142; i++) {
    const r = (arr: unknown[]) => arr[Math.floor(rand() * arr.length)];
    const categoryIdx = (i - 1) % CATEGORY_DIST.length;
    const category = CATEGORY_DIST[categoryIdx] as IncidentCategory;
    const incidentOptions = INCIDENT_POOL.filter((p) => p.category === category);
    const incident = r(incidentOptions) as (typeof INCIDENT_POOL)[0];
    const from = r(COURIERS) as (typeof COURIERS)[0];
    const to = r(REPLACEMENTS) as (typeof REPLACEMENTS)[0];
    const serviceType = r(SERVICE_TYPES) as ServiceType;
    const offsetMs = Math.floor(rand() * 30 * 24 * 60 * 60 * 1000); // within 30 days
    const dt = new Date(baseMs - offsetMs);
    const handling = Math.floor(10 + rand() * 30); // 10–40 seconds
    const slaCompliant = rand() > 0.021; // ~98.2% compliance

    const evidenceInfo = EVIDENCE_MAP[category] ?? EVIDENCE_MAP['Cuaca / Hujan'];
    const hasEvidence = category !== 'Anomali Suhu';

    rows.push({
      id: `AUD-${String(i).padStart(3, '0')}`,
      resi: `10002400${String(i).padStart(4, '0')}`,
      serviceType,
      completedAt: dt.toISOString().slice(0, 19),
      fromCourier: from.name,
      fromCourierCode: from.code,
      toCourier: to.name,
      toCourierCode: to.code,
      incidentCategory: category,
      incidentDetail: incident.detail,
      handlingSeconds: handling,
      slaCompliant,
      evidenceImageUrl: hasEvidence ? evidenceInfo.url : '',
      evidencePublicId: hasEvidence ? evidenceInfo.publicId : undefined,
      evidenceCaption: hasEvidence ? incident.detail : undefined,
    });
  }

  return rows;
}

export const mockAuditLogs: AuditLogEntry[] = [
  ...PINNED_ROWS,
  ...generateBulkRows(),
];

export const auditKpi: AuditKpi = {
  totalCompleted: 142,
  avgHandlingSeconds: 18.4,
  slaComplianceRate: 98.2,
  slaCompliantCount: 139,
};

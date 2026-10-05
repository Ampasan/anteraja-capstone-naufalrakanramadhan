import { describe, expect, it } from 'vitest';
import { OPERATIONAL_NOW_ISO } from '../operationalClock';
import type { AuditLogEntry } from '../../features/audit-logs/types';
import type { ActivePackage } from '../../features/monitoring/types';
import {
  formatDistance,
  mapAuditKpi,
  mapAuditLog,
  mapAuditLogs,
  mapCouriers,
  mapHub,
  mapIncident,
  mapIncidentAlert,
  mapIncidents,
  mapSlaOrders,
  minutesUntil,
  nearestDropPoint,
  percentElapsed,
  type RawAuditLog,
  type RawAuditSummary,
  type RawCourier,
  type RawHub,
  type RawIncident,
  type RawOrder,
} from '../mappers';

const OP_NOW_MS = Date.parse(OPERATIONAL_NOW_ISO);
/** Waktu ISO relatif terhadap jam operasional yang dibekukan. */
const at = (minutes: number) => new Date(OP_NOW_MS + minutes * 60_000).toISOString();

const HUB_POSITION = { lat: -6.2651893, lng: 106.8767953 };

const RAW_HUB: RawHub = {
  id: 'hub-1',
  name: 'Hub Halim - Jakarta Timur',
  short_name: 'HUB HALIM',
  city: 'Jakarta Timur',
  position: { lat: -6.265, lng: 106.876 },
  radius_km: 5,
  capacity_used: 40,
  capacity_total: 100,
};

const RAW_ORDER: RawOrder = {
  id: 'o1',
  waybill_number: 'INV-001',
  courier_id: 'c1',
  courier_name: 'Budi Santoso',
  courier_code: 'CR-01',
  service_type: 'Frozen',
  weight_kg: 2.5,
  sla_deadline: at(60),
  remaining_minutes: 45,
  elapsed_pct: 60,
  risk_level: 'Kritis',
  risk_label: 'Kritis',
  risk_color: 'red',
  status: 'IN_TRANSIT',
  origin_lat: HUB_POSITION.lat,
  origin_lng: HUB_POSITION.lng,
  drop_lat: -6.27,
  drop_lng: 106.88,
  destination_name: 'Toko Sejahtera',
  destination_area: 'Jakarta Utara',
  condition: { key: 'temp-box', label: 'Suhu Box Menyimpang' },
  temperature_c: 8,
  order_time: at(-90),
  category: null,
};

const RAW_COURIER_IDLE: RawCourier = {
  id: 'c1',
  courier_code: 'CR-01',
  name: 'Budi Santoso',
  initials: 'BS',
  status: 'IDLE',
  vehicle_type: 'Motorcycle',
  phone_number: '081234567890',
  license_plate: 'B 1111 XYZ',
  current_parcel_count: 2,
  max_parcel_count: 6,
  current_load_kg: 15,
  max_capacity_kg: 18,
  current_address: 'Jl. Pulo Mas Raya',
  idle_duration: '12 menit',
  distance_from_hub_m: 850,
  inside_radius: true,
  radius_km: 5,
  position: { lat: -6.266, lng: 106.877 },
  hub_position: HUB_POSITION,
  active_packages: [
    {
      waybill_number: 'INV-001',
      service_type: 'Frozen',
      weight_kg: 2.5,
      recipient_name: 'Siti',
      destination_address: 'Jl. Pulo Mas No. 1',
      drop_lat: -6.27,
      drop_lng: 106.88,
      order_time: at(-90),
      sla_deadline: at(60),
      delivery_status: 'IN_TRANSIT',
    },
    {
      waybill_number: 'INV-002',
      service_type: 'Regular',
      weight_kg: 1,
      recipient_name: 'Andi',
      destination_address: 'Jl. Danau Sunter',
      drop_lat: -6.28,
      drop_lng: 106.87,
      order_time: null,
      sla_deadline: at(30),
      delivery_status: 'IN_TRANSIT',
    },
  ],
};

const RAW_COURIER_ONLINE: RawCourier = {
  ...RAW_COURIER_IDLE,
  id: 'c2',
  courier_code: 'CR-02',
  name: 'Rina Wijaya',
  initials: 'RW',
  status: 'ONLINE',
  position: { lat: -6.27, lng: 106.88 },
  active_packages: undefined,
};

const RAW_CANDIDATE = {
  id: 'c3',
  courier_code: 'CR-03',
  name: 'Dedi',
  initials: 'DD',
  vehicle_type: 'Motorcycle',
  license_plate: 'B 3333',
  status: 'ONLINE',
  current_parcel_count: 4,
  max_parcel_count: 6,
  current_load_kg: 12,
  max_capacity_kg: 15,
  distance_m: 1200,
  eta_minutes: 8,
  is_recommended: true,
  badge: 'Terdekat',
};

const RAW_INCIDENT: RawIncident = {
  id: 'inc-1',
  incident_code: 'INC-HLM-082',
  severity: 'CRITICAL',
  status: 'RESOLVED',
  status_label: 'Selesai',
  waybill_number: 'INV-001',
  service_type: 'Frozen',
  service_label: 'Frozen',
  courier: {
    id: 'c1',
    name: 'Budi Santoso',
    vehicle_type: 'Motorcycle',
    vehicle_plate: 'B 1111 XYZ',
    phone: '081234567890',
  },
  replacement_courier: {
    id: 'c2',
    name: 'Rina Wijaya',
    courier_code: 'CR-02',
    vehicle_type: 'Motorcycle',
    vehicle_plate: 'B 4444',
  },
  kendala: 'Suhu box naik',
  kendala_detail: 'Suhu 8 derajat',
  incident_category: 'Anomali Suhu',
  stopped_location: 'Jl. Pulo Mas Raya',
  destination: 'Toko Sejahtera',
  muatan: 'Frozen',
  weight_kg: 2.5,
  reported_at: at(-10),
  resolved_at: at(-2),
  candidates: [RAW_CANDIDATE],
  latitude: -6.27,
  longitude: 106.88,
};

const RAW_LOG: RawAuditLog = {
  id: 'log-1',
  resi: 'INV-001',
  service_type: 'Frozen',
  completed_at: at(-30),
  from_courier: 'Budi Santoso',
  from_courier_code: 'CR-01',
  to_courier: 'Rina Wijaya',
  to_courier_code: 'CR-02',
  incident_category: 'Anomali Suhu',
  incident_detail: 'Suhu box naik',
  report_status: 'Selesai',
  handling_seconds: 240,
  sla_compliant: true,
  executor_name: 'Nina',
};

function auditEntry(overrides: Partial<AuditLogEntry>): AuditLogEntry {
  return {
    id: 'x',
    resi: 'INV-X',
    serviceType: 'Regular',
    completedAt: at(0),
    fromCourier: 'A',
    fromCourierCode: 'A',
    toCourier: 'B',
    toCourierCode: 'B',
    incidentCategory: 'Ban Bocor',
    incidentDetail: '',
    reportStatus: 'Selesai',
    handlingSeconds: 60,
    slaCompliant: false,
    evidenceImageUrl: '',
    ...overrides,
  };
}

describe('mapHub', () => {
  it('mengubah snake_case menjadi bentuk yang dipakai UI', () => {
    expect(mapHub(RAW_HUB)).toEqual({
      id: 'hub-1',
      name: 'Hub Halim - Jakarta Timur',
      shortName: 'HUB HALIM',
      position: { lat: -6.265, lng: 106.876 },
      radiusKm: 5,
      capacityUsed: 40,
      capacityTotal: 100,
    });
  });

  it('koordinat tak terpakai jatuh ke (0,0) alih-alih membuat penanda liar', () => {
    expect(mapHub({ ...RAW_HUB, position: { lat: NaN, lng: NaN } }).position).toEqual({
      lat: 0,
      lng: 0,
    });
  });
});

describe('mapCouriers', () => {
  const couriers = mapCouriers([RAW_COURIER_IDLE, RAW_COURIER_ONLINE], [RAW_ORDER]);

  it('memetakan paket aktif memakai baris SLA bila resinya dikenal', () => {
    expect(couriers[0].activePackages).toHaveLength(2);
    expect(couriers[0].activePackages[0]).toMatchObject({
      waybillNumber: 'INV-001',
      slaRemainingMinutes: 45,
      slaElapsedPct: 60,
      recipientName: 'Siti',
    });
  });

  it('pakai hitungan sendiri ketika resi belum ada di baris SLA', () => {
    expect(couriers[0].activePackages[1]).toMatchObject({
      waybillNumber: 'INV-002',
      slaRemainingMinutes: 30,
    });
    expect(couriers[0].activePackages[1].slaElapsedPct).toBeGreaterThanOrEqual(0);
  });

  it('kurir IDLE mendapat rute posisi -> titik drop terdekat', () => {
    const route = couriers[0].route;

    expect(route?.polyline).toEqual([
      { lat: -6.266, lng: 106.877 },
      { lat: -6.27, lng: 106.88 },
    ]);
    expect(route?.eta).toBe('30 mnt');
  });

  it('kurir ONLINE tanpa paket tidak mendapat rute', () => {
    expect(couriers[1].route).toBeUndefined();
    expect(couriers[1].activePackages).toEqual([]);
    expect(couriers[1].status).toBe('ONLINE');
  });

  it('anomali cold-chain terdeteksi dari paket Frozen bersuhu tinggi', () => {
    expect(couriers[0].coldChainAnomaly).toEqual({
      waybillNumber: 'INV-001',
      currentTempC: 8,
      maxAllowedTempC: 5,
      detectedAt: 'Baru Saja',
    });
    expect(couriers[1].coldChainAnomaly).toBeUndefined();
  });

  it('status di luar ONLINE/IDLE diperlakukan sebagai IDLE', () => {
    const [mapped] = mapCouriers([{ ...RAW_COURIER_IDLE, status: 'ALERT' }], []);

    expect(mapped.status).toBe('IDLE');
  });

  it('baris kembar berdasarkan id dibuang', () => {
    expect(mapCouriers([RAW_COURIER_IDLE, RAW_COURIER_IDLE], [])).toHaveLength(1);
  });
});

describe('mapSlaOrders', () => {
  const orders = mapSlaOrders([RAW_ORDER, { ...RAW_ORDER, id: 'o1-dupe' }], [RAW_COURIER_IDLE]);

  it('membangun lookup kurir per waybill dan membuang resi kembar', () => {
    expect(orders).toHaveLength(1);
    expect(orders[0].detail.loadKnown).toBe(true);
    expect(orders[0].detail.vehicleType).toBe('Motorcycle');
    expect(orders[0]).toMatchObject({
      waybillNumber: 'INV-001',
      slaRemainingMin: 45,
      slaRisk: 'Kritis',
      condition: { key: 'temp-box', label: 'Suhu Box Menyimpang' },
    });
    expect(orders[0].detail.cargoClassification).toBe('Produk Beku / Cold Chain');
  });

  it('kurir yang belum terdata ditandai loadKnown=false', () => {
    const [mapped] = mapSlaOrders([{ ...RAW_ORDER, courier_id: 'belum-ada' }], [RAW_COURIER_IDLE]);

    expect(mapped.detail.loadKnown).toBe(false);
    expect(mapped.detail.vehicleType).toBe('—');
    expect(mapped.detail.loadUsedKg).toBe(0);
  });

  it('status kiriman tak dikenal jatuh ke IN_TRANSIT', () => {
    const [mapped] = mapSlaOrders([{ ...RAW_ORDER, status: 'HILANG' }], []);

    expect(mapped.status).toBe('IN_TRANSIT');
  });

  it('kategori kiriman mengalahkan klasifikasi bawaan', () => {
    const [mapped] = mapSlaOrders([{ ...RAW_ORDER, category: 'Dokumen Medis' }], []);

    expect(mapped.detail.cargoClassification).toBe('Dokumen Medis');
  });

  it('muatan dihitung dari daftar paket, bukan kolom current_load_kg', () => {
    const [mapped] = mapSlaOrders([RAW_ORDER], [RAW_COURIER_IDLE]);

    expect(mapped.detail.loadUsedKg).toBe(3.5);
    expect(mapped.detail.loadCapacityKg).toBe(20);
  });
});

describe('mapIncident', () => {
  it('mempertahankan severity dan status yang dikenal', () => {
    const mapped = mapIncident(RAW_INCIDENT);

    expect(mapped.severity).toBe('CRITICAL');
    expect(mapped.status).toBe('RESOLVED');
    expect(mapped.replacementCourier).toMatchObject({ id: 'c2', name: 'Rina Wijaya' });
    expect(mapped.kendalaDetail).toBe('Suhu 8 derajat');
  });

  it('nilai di luar daftar jatuh ke WARNING dan REPORTED', () => {
    const mapped = mapIncident({ ...RAW_INCIDENT, severity: 'TINGGI', status: 'DIAM' });

    expect(mapped.severity).toBe('WARNING');
    expect(mapped.status).toBe('REPORTED');
  });

  it('SAFE lolos tanpa diubah', () => {
    expect(mapIncident({ ...RAW_INCIDENT, severity: 'SAFE' }).severity).toBe('SAFE');
  });

  it('kurir pengganti kosong menjadi undefined', () => {
    expect(mapIncident({ ...RAW_INCIDENT, replacement_courier: null }).replacementCourier)
      .toBeUndefined();
  });

  it('kandidat dihitung sisa kapasitasnya dan dibuang bilamana minus', () => {
    const mapped = mapIncident(RAW_INCIDENT);

    expect(mapped.candidates[0]).toMatchObject({
      remainingCapacityKg: 3,
      isRecommended: true,
      badge: 'Terdekat',
    });

    const over = mapIncident({
      ...RAW_INCIDENT,
      candidates: [{ ...RAW_CANDIDATE, current_load_kg: 20, max_capacity_kg: 15 }],
    });
    expect(over.candidates[0].remainingCapacityKg).toBe(0);
  });

  it('insiden kembar berdasarkan id dibuang', () => {
    expect(mapIncidents([RAW_INCIDENT, RAW_INCIDENT])).toHaveLength(1);
  });
});

describe('mapIncidentAlert', () => {
  it('kategori Anomali Suhu memakai gaya dingin dan waktu relatif jam operasional', () => {
    const alert = mapIncidentAlert(mapIncident(RAW_INCIDENT));

    expect(alert).toMatchObject({
      type: 'cold-chain',
      icon: 'snowflake',
      title: 'Anomali Suhu',
      description: 'Suhu 8 derajat',
      severity: 'CRITICAL',
      courierName: 'Budi Santoso',
      location: 'Jl. Pulo Mas Raya',
      timestamp: '10 mnt lalu',
    });
  });

  it('kategori tak dikenal memakai gaya default dan menjatuhkan deskripsi ke kendala', () => {
    const alert = mapIncidentAlert(
      mapIncident({ ...RAW_INCIDENT, incident_category: 'Lainnya', kendala_detail: null }),
    );

    expect(alert.type).toBe('other');
    expect(alert.icon).toBe('alert-triangle');
    expect(alert.description).toBe('Suhu box naik');
    expect(alert.title).toBe('Suhu box naik');
  });

  it('laporan lebih baru dari jam operasional terbaca sebagai Baru Saja', () => {
    const alert = mapIncidentAlert(mapIncident({ ...RAW_INCIDENT, reported_at: at(5) }));

    expect(alert.timestamp).toBe('Baru Saja');
  });
});

describe('mapAuditLog', () => {
  it('mengubah baris mentah menjadi entri UI', () => {
    expect(mapAuditLog(RAW_LOG)).toMatchObject({
      resi: 'INV-001',
      reportStatus: 'Selesai',
      handlingSeconds: 240,
      slaCompliant: true,
      executorName: 'Nina',
      logCode: undefined,
    });
  });

  it('status laporan dinormalisasi tanpa peduli huruf besar/kecil', () => {
    expect(mapAuditLog({ ...RAW_LOG, report_status: ' selesai ' }).reportStatus).toBe('Selesai');
    expect(mapAuditLog({ ...RAW_LOG, report_status: 'Eskalasi' }).reportStatus).toBe('Eskalasi');
  });

  it('pengalihan pada hari operasional berjalan tetap berstatus Dialihkan', () => {
    expect(mapAuditLog({ ...RAW_LOG, report_status: 'Dialihkan' }).reportStatus).toBe('Dialihkan');
    expect(mapAuditLog({ ...RAW_LOG, report_status: ' dialihkan ' }).reportStatus).toBe('Dialihkan');
  });

  it('status di luar daftar jatuh ke Selesai', () => {
    expect(mapAuditLog({ ...RAW_LOG, report_status: 'Hilang' }).reportStatus).toBe('Selesai');
    expect(mapAuditLog({ ...RAW_LOG, report_status: null }).reportStatus).toBe('Selesai');
  });

  it('field opsional kosong memakai string kosong, bukan undefined', () => {
    const mapped = mapAuditLog({
      ...RAW_LOG,
      from_courier_code: undefined,
      incident_detail: undefined,
      evidence_image_url: undefined,
    });

    expect(mapped.fromCourierCode).toBe('');
    expect(mapped.incidentDetail).toBe('');
    expect(mapped.evidenceImageUrl).toBe('');
  });

  it('baris kembar berdasarkan id dibuang', () => {
    expect(mapAuditLogs([RAW_LOG, RAW_LOG])).toHaveLength(1);
  });
});

describe('mapAuditKpi', () => {
  it('prioritaskan ringkasan dari server', () => {
    const summary: RawAuditSummary = {
      total_completed: 120,
      avg_handling_seconds: 180,
      sla_compliance_rate: 92.5,
      sla_compliant_count: 111,
    };

    expect(mapAuditKpi(summary, [auditEntry({})])).toEqual({
      totalCompleted: 120,
      avgHandlingSeconds: 180,
      slaComplianceRate: 92.5,
      slaCompliantCount: 111,
    });
  });

  it('tanpa ringkasan, KPI dihitung dari daftar riwayat', () => {
    const logs = [
      auditEntry({ id: 'a', handlingSeconds: 100, slaCompliant: true }),
      auditEntry({ id: 'b', handlingSeconds: 200, slaCompliant: false }),
      auditEntry({ id: 'c', handlingSeconds: 300, slaCompliant: true }),
    ];

    expect(mapAuditKpi(undefined, logs)).toEqual({
      totalCompleted: 3,
      avgHandlingSeconds: 200,
      slaComplianceRate: (2 / 3) * 100,
      slaCompliantCount: 2,
    });
  });

  it('daftar kosong menghasilkan nol, bukan NaN', () => {
    expect(mapAuditKpi(undefined, [])).toEqual({
      totalCompleted: 0,
      avgHandlingSeconds: 0,
      slaComplianceRate: 0,
      slaCompliantCount: 0,
    });
  });
});

describe('minutesUntil', () => {
  it('dihitung dari jam operasional yang dibekukan', () => {
    expect(minutesUntil(at(90))).toBe(90);
    expect(minutesUntil(at(-15))).toBe(-15);
    expect(minutesUntil(OPERATIONAL_NOW_ISO)).toBe(0);
  });

  it('waktu tak terbaca dianggap 0', () => {
    expect(minutesUntil('bukan-tanggal')).toBe(0);
  });
});

describe('formatDistance', () => {
  it('memilih satuan sesuai ambang kilometer', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(999.4)).toBe('999 m');
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1234)).toBe('1.2 km');
  });

  it('angka tak hingga menampilkan strip, bukan NaN', () => {
    expect(formatDistance(Number.NaN)).toBe('—');
    expect(formatDistance(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('percentElapsed', () => {
  it('berada di tengah rentang ketika waktu berjalan separuh', () => {
    expect(percentElapsed(at(-120), at(120))).toBe(50);
  });

  it('dijepit antara 0 dan 100', () => {
    expect(percentElapsed(at(-240), at(-180))).toBe(100);
    expect(percentElapsed(at(60), at(120))).toBe(0);
  });

  it('rentang tidak valid dianggap 0', () => {
    expect(percentElapsed(at(0), at(0))).toBe(0);
    expect(percentElapsed('aneh', at(60))).toBe(0);
  });
});

describe('nearestDropPoint', () => {
  const from = { lat: 0, lng: 0 };
  const pkg = (waybillNumber: string, lat: number, lng: number): ActivePackage => ({
    waybillNumber,
    serviceType: 'Regular',
    weightKg: 1,
    recipientName: 'Penerima',
    recipientAddress: 'Jl. Contoh',
    dropLat: lat,
    dropLng: lng,
    slaRemainingMinutes: 30,
    slaElapsedPct: 40,
  });

  it('memilih titik drop paling dekat', () => {
    expect(nearestDropPoint([pkg('a', 3, 4), pkg('b', 1, 1)], from)).toEqual({ lat: 1, lng: 1 });
  });

  it('mengabaikan koordinat tak terhingga dan mengembalikan null bila tak ada yang layak', () => {
    expect(nearestDropPoint([pkg('a', Number.NaN, Number.NaN)], from)).toBeNull();
    expect(nearestDropPoint([], from)).toBeNull();
  });
});

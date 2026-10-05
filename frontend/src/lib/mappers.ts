import type {
  ActivePackage,
  ColdChainAnomaly,
  Courier,
  Hub,
  IncidentAlert,
  LatLng,
} from '../features/monitoring/types';
import type { CandidateCourier, IncidentReport } from '../features/incidents/types';
import type { AuditKpi, AuditLogEntry, ReportStatus } from '../features/audit-logs/types';
import type { CargoDetail, HazardAnalysis, SlaOrder, TimelineStep } from '../features/sla-risk/types';
import { operationalNowMs } from './operationalClock';

// ─── DTO mentah dari API ─────────────────────────────────────────────────────

export interface LatLon {
  lat: number;
  lng: number;
}

export interface RawHub {
  id: string;
  name: string;
  short_name: string;
  city: string;
  position: LatLon;
  radius_km: number;
  capacity_used: number;
  capacity_total: number;
}

export interface RawTelemetry {
  speed_kmh?: number | null;
  temperature_c?: number | null;
  battery_level?: number | null;
  recorded_at?: string | null;
}

export interface RawCourier {
  id: string;
  courier_code: string;
  name: string;
  initials: string;
  status: string;
  vehicle_type: string;
  phone_number: string;
  license_plate: string;
  current_parcel_count: number;
  max_parcel_count: number;
  current_load_kg: number;
  max_capacity_kg: number;
  current_address?: string | null;
  is_bpom_certified?: boolean;
  has_thermal_box?: boolean;
  idle_duration?: string | null;
  is_stale?: boolean;
  distance_from_hub_m?: number | null;
  inside_radius?: boolean | null;
  radius_km?: number | null;
  position: LatLon;
  telemetry?: RawTelemetry | null;
  hub_position: LatLon;
  active_packages?: RawCourierPackage[];
}

export interface RawCourierPackage {
  waybill_number: string;
  service_type: string;
  weight_kg: number;
  recipient_name: string;
  destination_address: string;
  drop_lat: number;
  drop_lng: number;
  order_time?: string | null;
  sla_deadline: string;
  delivery_status: string;
}

export interface RawCourierDetail extends Omit<RawCourier, 'position' | 'hub_position'> {
  position?: LatLon;
  hub_position?: LatLon;
}

export interface RawOrderCondition {
  key: string;
  label: string;
}

export interface RawOrder {
  id: string;
  waybill_number: string;
  courier_id: string;
  courier_name: string;
  courier_code: string;
  service_type: string;
  weight_kg: number;
  sla_deadline: string;
  remaining_minutes: number;
  elapsed_pct: number;
  risk_level: string;
  risk_label: string;
  risk_color: string;
  status: string;
  origin_lat: number;
  origin_lng: number;
  drop_lat: number;
  drop_lng: number;
  destination_name: string;
  destination_area: string;
  condition: RawOrderCondition;
  weather_condition?: string | null;
  traffic_condition?: string | null;
  temperature_c?: number | null;
  sla_risk_score?: number | null;
  risk_score?: number | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  order_time?: string | null;
  pickup_time?: string | null;
  category?: string | null;
}

export interface RawCandidate {
  id: string;
  courier_code: string;
  name: string;
  initials: string;
  vehicle_type: string;
  license_plate: string;
  status: string;
  current_parcel_count: number;
  max_parcel_count: number;
  current_load_kg: number;
  max_capacity_kg: number;
  distance_m: number;
  eta_minutes: number;
  is_recommended: boolean;
  badge: string;
}

export interface RawIncident {
  id: string;
  incident_code: string;
  severity: string;
  status: string;
  status_label: string;
  waybill_number: string;
  service_type: string;
  service_label: string;
  courier: {
    id: string;
    name: string;
    vehicle_type: string;
    vehicle_plate: string;
    phone: string;
  };
  replacement_courier?: {
    id: string;
    name: string;
    courier_code?: string | null;
    vehicle_type?: string | null;
    vehicle_plate?: string | null;
  } | null;
  kendala: string;
  kendala_detail?: string | null;
  incident_category?: string | null;
  stopped_location: string;
  destination: string;
  muatan: string;
  weight_kg: number;
  reported_at: string;
  resolved_at?: string | null;
  evidence_image_url?: string | null;
  evidence_public_id?: string | null;
  evidence_caption?: string | null;
  candidates: RawCandidate[];
  latitude?: number | null;
  longitude?: number | null;
  weather_condition?: string | null;
  traffic_condition?: string | null;
  temperature_c?: number | null;
}

export interface RawAuditLog {
  id: string;
  log_code?: string;
  // Nama kurir bisa kosong bila relasinya belum terisi — jangan sampai
  // menjatuhkan seluruh tabel riwayat saat dipetakan.
  resi: string | null;
  service_type: string;
  completed_at: string;
  from_courier: string | null;
  from_courier_code?: string | null;
  to_courier: string | null;
  to_courier_code?: string | null;
  incident_category: string | null;
  incident_detail?: string | null;
  report_status?: string | null;
  handling_seconds: number;
  sla_compliant: boolean;
  executor_name?: string | null;
  evidence_image_url?: string | null;
  evidence_public_id?: string | null;
  evidence_caption?: string | null;
}

export interface RawAuditSummary {
  total_completed: number;
  avg_handling_seconds: number;
  sla_compliance_rate: number;
  sla_compliant_count: number;
}

// ─── Utilitas ────────────────────────────────────────────────────────────────

/** Sisa menit sampai waktu ISO (bisa negatif bila sudah lewat). */
export function minutesUntil(iso: string): number {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.round((target - operationalNowMs()) / 60000);
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function percentElapsed(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return clamp(Math.round(((operationalNowMs() - from) / (to - from)) * 100), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toLatLon(point: LatLon | undefined | null, fallback?: LatLon): LatLon {
  if (point && Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
    return { lat: point.lat, lng: point.lng };
  }

  return { lat: fallback?.lat ?? 0, lng: fallback?.lng ?? 0 };
}

// ─── Hubs ────────────────────────────────────────────────────────────────────

export function mapHub(raw: RawHub): Hub {
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    position: toLatLon(raw.position),
    radiusKm: raw.radius_km,
    capacityUsed: raw.capacity_used,
    capacityTotal: raw.capacity_total,
  };
}

// ─── Paket aktif (daftar kurir + panel detail) ──────────────────────────────

function indexOrdersByWaybill(orders: RawOrder[]): Map<string, RawOrder> {
  return new Map(orders.map((o) => [o.waybill_number, o]));
}

function buildActivePackages(
  rawPackages: RawCourierPackage[] | undefined,
  orders: RawOrder[] | Map<string, RawOrder>,
): ActivePackage[] {
  const ordersByWaybill =
    orders instanceof Map ? orders : indexOrdersByWaybill(orders);

  return (rawPackages ?? []).map((pkg) => {
    const sla = ordersByWaybill.get(pkg.waybill_number);
    const remaining = sla ? sla.remaining_minutes : minutesUntil(pkg.sla_deadline);
    const elapsed = sla
      ? sla.elapsed_pct
      : pkg.order_time
        ? percentElapsed(pkg.order_time, pkg.sla_deadline)
        : remaining <= 0
          ? 100
          : clamp(Math.round(((180 - Math.max(0, remaining)) / 180) * 100), 0, 100);

    return {
      waybillNumber: pkg.waybill_number,
      serviceType: pkg.service_type,
      weightKg: pkg.weight_kg,
      recipientName: pkg.recipient_name,
      recipientAddress: pkg.destination_address,
      dropLat: pkg.drop_lat,
      dropLng: pkg.drop_lng,
      slaRemainingMinutes: remaining,
      slaElapsedPct: elapsed,
    };
  });
}

function findColdChainAnomaly(
  packages: ActivePackage[],
  orders: RawOrder[] | Map<string, RawOrder>,
): ColdChainAnomaly | undefined {
  const ordersByWaybill =
    orders instanceof Map ? orders : indexOrdersByWaybill(orders);
  const anomaly = packages.find((pkg) => {
    const order = ordersByWaybill.get(pkg.waybillNumber);
    return (
      !!order && order.service_type === 'Frozen' && typeof order.temperature_c === 'number' && order.temperature_c > 5
    );
  });

  const temperature = anomaly ? ordersByWaybill.get(anomaly.waybillNumber)?.temperature_c : undefined;
  if (!anomaly || typeof temperature !== 'number') return undefined;

  return {
    waybillNumber: anomaly.waybillNumber,
    currentTempC: temperature,
    maxAllowedTempC: 5,
    detectedAt: 'Baru Saja',
  };
}

export function nearestDropPoint(packages: ActivePackage[], from: LatLng): LatLng | null {
  let best: LatLng | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const pkg of packages) {
    if (!Number.isFinite(pkg.dropLat) || !Number.isFinite(pkg.dropLng)) continue;
    const distance = (pkg.dropLat - from.lat) ** 2 + (pkg.dropLng - from.lng) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { lat: pkg.dropLat, lng: pkg.dropLng };
    }
  }

  return best;
}

/**
 * @return minimal 2 titik, atau undefined bila tidak cukup untuk satu garis.
 */
function polylineFrom(
  position: LatLon,
  packages: ActivePackage[],
): LatLon[] | undefined {
  const points: LatLon[] = [];

  const push = (point: LatLon) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    const last = points[points.length - 1];
    if (last && last.lat === point.lat && last.lng === point.lng) return;
    points.push({ lat: point.lat, lng: point.lng });
  };

  push(position);

  const drop = nearestDropPoint(packages, position);
  if (drop) push(drop);

  return points.length >= 2 ? points : undefined;
}

function buildRoute(
  courier: { status: string; position?: LatLon | null; hub_position?: LatLon | null },
  packages: ActivePackage[],
) {
  if (packages.length === 0) return undefined;
  if (courier.status !== 'IDLE') return undefined;

  const hubPosition = toLatLon(courier.hub_position);
  const polyline = polylineFrom(toLatLon(courier.position, hubPosition), packages);
  if (!polyline) return undefined;

  const nearest = packages.reduce((min, p) => Math.min(min, p.slaRemainingMinutes), Infinity);
  return {
    polyline,
    eta: Number.isFinite(nearest) ? `${Math.max(0, nearest)} mnt` : '—',
  };
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function mapCouriers(raw: RawCourier[], orders: RawOrder[]): Courier[] {
  const ordersByWaybill = indexOrdersByWaybill(orders);

  return dedupeBy(raw, (c) => c.id).map((c) => {
    const activePackages = buildActivePackages(c.active_packages, ordersByWaybill);
    const hubPosition = toLatLon(c.hub_position);
    const status = c.status === 'ONLINE' || c.status === 'IDLE' ? c.status : 'IDLE';

    return {
      id: c.id,
      name: c.name,
      initials: c.initials,
      status,
      vehicle: c.vehicle_type,
      position: toLatLon(c.position, hubPosition),
      hubPosition,
      activePackages,
      parcelCount: c.current_parcel_count,
      capacityTotal: c.max_parcel_count,
      idleDuration: c.idle_duration ?? undefined,
      speedKmh: c.telemetry?.speed_kmh ?? undefined,
      distanceFromHubM: c.distance_from_hub_m ?? undefined,
      insideRadius: c.inside_radius ?? undefined,
      hubRadiusKm: c.radius_km ?? undefined,
      lastKnownAddress: c.current_address ?? undefined,
      route: buildRoute({ status, position: c.position, hub_position: c.hub_position }, activePackages),
      coldChainAnomaly: findColdChainAnomaly(activePackages, ordersByWaybill),
      phone: c.phone_number,
    };
  });
}

export function mapCourierDetail(
  raw: RawCourierDetail,
  base: Courier | undefined,
  orders: RawOrder[],
): Courier {
  const ordersByWaybill = indexOrdersByWaybill(orders);
  const activePackages = buildActivePackages(raw.active_packages, ordersByWaybill);
  const hubPosition = base?.hubPosition ?? toLatLon(raw.hub_position);
  const position = base?.position ?? toLatLon(raw.position, hubPosition);
  const status = raw.status === 'ONLINE' || raw.status === 'IDLE' ? raw.status : 'IDLE';

  return {
    id: raw.id,
    name: raw.name,
    initials: raw.initials,
    status,
    vehicle: raw.vehicle_type,
    position,
    hubPosition,
    activePackages,
    parcelCount: raw.current_parcel_count,
    capacityTotal: raw.max_parcel_count,
    idleDuration: raw.idle_duration ?? undefined,
    speedKmh: raw.telemetry?.speed_kmh ?? base?.speedKmh,
    distanceFromHubM: raw.distance_from_hub_m ?? base?.distanceFromHubM,
    insideRadius: raw.inside_radius ?? base?.insideRadius,
    hubRadiusKm: raw.radius_km ?? base?.hubRadiusKm,
    lastKnownAddress: raw.current_address ?? undefined,
    route: buildRoute({ status, position: raw.position, hub_position: raw.hub_position }, activePackages),
    coldChainAnomaly: findColdChainAnomaly(activePackages, ordersByWaybill),
    phone: raw.phone_number,
  };
}

// ─── SLA Risk ────────────────────────────────────────────────────────────────

const CARGO_CLASSIFICATION: Record<string, string> = {
  Frozen: 'Produk Beku / Cold Chain',
  PHARMA: 'Obat & Farmasi (BPOM)',
  Cargo: 'Kargo Umum',
  'Mini Cargo': 'Kargo Ringan',
  Instant: 'Paket Kilat',
  'Same Day': 'Kirim Hari Ini',
  'Next Day': 'Kirim Besok',
  Regular: 'Kiriman Reguler',
  Dokumen: 'Dokumen & Arsip',
};

function cargoClassification(serviceType: string): string {
  return CARGO_CLASSIFICATION[serviceType] ?? serviceType;
}

const VEHICLE_CAPACITY_KG: Array<{ pattern: RegExp; kg: number }> = [
  { pattern: /motor|sepeda|bike/, kg: 20 },
  { pattern: /pick\s*up/, kg: 600 },
  { pattern: /blind\s*van/, kg: 500 },
  { pattern: /van/, kg: 700 },
  { pattern: /truk|truck|wingbox|\belf\b/, kg: 1200 },
  { pattern: /mobil|car|suv|brio|avanza|innova/, kg: 150 },
  { pattern: /dokumen|velop|bagasi/, kg: 10 },
];

function vehicleCapacityKg(vehicleType: string | undefined): number | undefined {
  const key = (vehicleType ?? '').toLowerCase().trim();
  if (!key || key === '—' || key === '-') return undefined;
  return VEHICLE_CAPACITY_KG.find((entry) => entry.pattern.test(key))?.kg;
}

function loadUsedKgFor(courier: RawCourier | undefined): number {
  if (!courier) return 0;

  const listed = (courier.active_packages ?? []).reduce(
    (sum, pkg) => sum + (Number(pkg.weight_kg) || 0),
    0,
  );
  if (listed > 0) return Math.round(listed * 10) / 10;

  return Math.max(0, Number(courier.current_load_kg) || 0);
}

function loadCapacityKgFor(courier: RawCourier | undefined, order: RawOrder, usedKg: number): number {
  const fromCourier = Number(courier?.max_capacity_kg ?? 0);

  const base = vehicleCapacityKg(courier?.vehicle_type)
    ?? (fromCourier > 0 ? fromCourier : undefined)
    ?? Math.max(Number(order.weight_kg) || 1, 1);

  return Math.max(base, usedKg);
}

function trafficColor(traffic: string | null | undefined): 'green' | 'amber' | 'red' {
  const value = (traffic ?? '').toLowerCase();
  if (!value) return 'green';
  if (value.includes('macet') || value.includes('total') || value.includes('padat') || value.includes('parah')) {
    return 'red';
  }
  if (value.includes('sedang') || value.includes('ramai')) return 'amber';
  return 'green';
}

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${clockFormatter.format(date)} WIB`;
}

/** Tanggal singkat (WIB) untuk baris tenggat yang bisa lewat tengah malam. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
}

/**
 * Timeline Audit Kepatuhan SLA.
 * @return 4 langkah, atau 3 langkah tanpa "diambil" bila pickup_time kosong.
 */
function buildTimeline(order: RawOrder): TimelineStep[] {
  const remaining = order.remaining_minutes;
  const isLate = remaining <= 0;

  const now = operationalNowMs();
  const orderTime = order.order_time ?? '';
  const pickupTime = order.pickup_time ?? '';
  const past = (iso: string) => !!iso && new Date(iso).getTime() <= now;

  const steps: TimelineStep[] = [
    {
      status: past(orderTime) ? 'done' : 'pending',
      title: 'Pesanan diterima sistem',
      subtitle: `Resi ${order.waybill_number} • ${order.service_type} • ${order.courier_name}`,
      time: orderTime ? formatClock(orderTime) : '',
    },
    {
      status: past(pickupTime) ? 'done' : 'pending',
      title: 'Paket diambil kurir dari hub',
      subtitle: `Muat ${order.weight_kg} kg • Tujuan ${order.destination_area}`,
      time: pickupTime ? formatClock(pickupTime) : 'Menunggu pengambilan',
    },
    {
      status: past(pickupTime) ? 'done' : 'pending',
      title: 'Dalam perjalanan ke tujuan',
      subtitle: `${order.weather_condition ?? 'Cuaca normal'} • ${order.traffic_condition ?? 'Lalu lintas lancar'}`,
      time: '',
      badge: isLate
        ? `Lewat ${Math.abs(remaining)} menit`
        : `Sisa ${remaining} menit`,
      badgeColor: isLate ? 'red' : remaining <= 15 ? 'amber' : 'green',
    },
    {
      status: isLate ? 'late' : 'pending',
      title: 'Tiba di tujuan (batas SLA)',
      subtitle: order.destination_area,
      time: '',
      etaBadge: order.sla_deadline
        ? `${formatDate(order.sla_deadline)} · ${formatClock(order.sla_deadline)}${isLate ? ' - terlambat' : ''}`
        : '',
    },
  ];

  return steps;
}

function buildHazard(order: RawOrder): HazardAnalysis {
  const score = Number(
    (order.sla_risk_score ?? order.risk_score ?? order.elapsed_pct / 10).toFixed(1),
  );
  const color = ['green', 'amber', 'red'].includes(order.risk_color)
    ? (order.risk_color as 'green' | 'amber' | 'red')
    : 'amber';

  return {
    weather: order.weather_condition || 'Cerah',
    traffic: order.traffic_condition || 'Lancar',
    trafficColor: trafficColor(order.traffic_condition),
    slaRiskScore: score,
    slaRiskLabel: order.risk_label,
    slaRiskColor: color,
  };
}

const ORDER_STATUSES = ['IN_TRANSIT', 'DELIVERED', 'RETURNED', 'REASSIGNED'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Batasi status kiriman ke nilai yang dikenali tipe UI. */
function mapOrderStatus(status: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(status)
    ? (status as OrderStatus)
    : 'IN_TRANSIT';
}

export function mapSlaOrder(order: RawOrder, couriersById: Map<string, RawCourier>): SlaOrder {
  const courier = couriersById.get(order.courier_id);
  const loadUsedKg = loadUsedKgFor(courier);

  const detail: CargoDetail = {
    courierId: order.courier_code,
    vehicleType: courier?.vehicle_type ?? '—',
    loadCapacityKg: loadCapacityKgFor(courier, order, loadUsedKg),
    loadUsedKg,
    loadKnown: !!courier,
    destinationName: order.destination_name,
    destinationAddress: order.destination_area,
    weightKg: order.weight_kg,
    cargoClassification: order.category || cargoClassification(order.service_type),
    recipientName: order.recipient_name ?? undefined,
    recipientPhone: order.recipient_phone ?? undefined,
    orderTime: order.order_time ?? undefined,
    timeline: buildTimeline(order),
    hazard: buildHazard(order),
  };

  return {
    waybillNumber: order.waybill_number,
    courierId: order.courier_id,
    serviceType: order.service_type,
    weightKg: order.weight_kg,
    slaDeadline: order.sla_deadline,
    status: mapOrderStatus(order.status),
    originLat: order.origin_lat,
    originLng: order.origin_lng,
    dropLat: order.drop_lat,
    dropLng: order.drop_lng,
    destinationName: order.destination_name,
    destinationArea: order.destination_area,
    condition: { key: order.condition.key, label: order.condition.label },
    slaRemainingMin: order.remaining_minutes,
    slaRisk: order.risk_level,
    detail,
  };
}

export function mapSlaOrders(orders: RawOrder[], couriers: RawCourier[]): SlaOrder[] {
  const couriersById = new Map(couriers.map((c) => [c.id, c]));
  return dedupeBy(orders, (o) => o.waybill_number).map((order) => mapSlaOrder(order, couriersById));
}

// ─── Insiden ─────────────────────────────────────────────────────────────────

export function mapCandidate(raw: RawCandidate): CandidateCourier {
  return {
    id: raw.id,
    name: raw.name,
    initials: raw.initials,
    vehicleType: raw.vehicle_type,
    vehiclePlate: raw.license_plate,
    distanceM: raw.distance_m,
    etaMinutes: raw.eta_minutes,
    remainingCapacityKg: Math.max(0, raw.max_capacity_kg - raw.current_load_kg),
    isRecommended: raw.is_recommended,
    badge: raw.badge,
    currentParcels: raw.current_parcel_count,
    maxParcels: raw.max_parcel_count,
  };
}

type IncidentStatus = IncidentReport['status'];

const KNOWN_STATUSES = [
  'REPORTED',
  'ACKNOWLEDGED',
  'REASSIGNING',
  'ESCALATED',
  'RESOLVED',
  'PENDING',
  'REVIEWING',
  'REASSIGNED',
] as const;

function mapIncidentStatus(status: string): IncidentStatus {
  return (KNOWN_STATUSES as readonly string[]).includes(status)
    ? (status as IncidentStatus)
    : 'REPORTED';
}

export function mapIncident(raw: RawIncident): IncidentReport {
  return {
    id: raw.id,
    incidentCode: raw.incident_code,
    severity: raw.severity === 'CRITICAL' || raw.severity === 'SAFE' ? raw.severity : 'WARNING',
    status: mapIncidentStatus(raw.status),
    statusLabel: raw.status_label,
    waybillNumber: raw.waybill_number,
    serviceType: raw.service_type,
    serviceLabel: raw.service_label,
    courier: {
      id: raw.courier.id,
      name: raw.courier.name,
      vehicleType: raw.courier.vehicle_type,
      vehiclePlate: raw.courier.vehicle_plate,
      phone: raw.courier.phone,
    },
    kendala: raw.kendala,
    kendalaDetail: raw.kendala_detail ?? undefined,
    incidentCategory: raw.incident_category ?? undefined,
    stoppedLocation: raw.stopped_location,
    destination: raw.destination,
    muatan: raw.muatan,
    weightKg: raw.weight_kg,
    reportedAt: raw.reported_at,
    resolvedAt: raw.resolved_at ?? undefined,
    replacementCourier: raw.replacement_courier
      ? {
          id: raw.replacement_courier.id,
          name: raw.replacement_courier.name,
          courierCode: raw.replacement_courier.courier_code ?? undefined,
          vehicleType: raw.replacement_courier.vehicle_type ?? undefined,
          vehiclePlate: raw.replacement_courier.vehicle_plate ?? undefined,
        }
      : undefined,
    evidenceImageUrl: raw.evidence_image_url ?? undefined,
    evidencePublicId: raw.evidence_public_id ?? undefined,
    evidenceCaption: raw.evidence_caption ?? undefined,
    candidates: raw.candidates.map(mapCandidate),
    weatherCondition: raw.weather_condition ?? undefined,
    trafficCondition: raw.traffic_condition ?? undefined,
    temperatureC: raw.temperature_c ?? undefined,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
  };
}

export function mapIncidents(raw: RawIncident[]): IncidentReport[] {
  return dedupeBy(raw, (i) => i.id).map(mapIncident);
}

// ─── Alarm monitoring (toast) ────────────────────────────────────────────────

type AlertStyle = Pick<IncidentAlert, 'type' | 'icon' | 'theme'>;

const ALERT_STYLES: Record<string, AlertStyle> = {
  'Anomali Suhu': {
    type: 'cold-chain',
    icon: 'snowflake',
    theme: {
      border: 'border-blue-300',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      accent: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  },
  'Mogok Kendaraan': {
    type: 'vehicle-breakdown',
    icon: 'wrench',
    theme: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      accent: 'bg-gradient-to-r from-red-500 to-orange-500',
      badge: 'bg-red-50 text-red-700 border-red-200',
    },
  },
  Banjir: {
    type: 'weather',
    icon: 'cloud-rain',
    theme: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      accent: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  },
  'Cuaca / Hujan': {
    type: 'weather',
    icon: 'cloud-rain',
    theme: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      accent: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  },
  'Ban Bocor': {
    type: 'vehicle-breakdown',
    icon: 'wrench',
    theme: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      accent: 'bg-gradient-to-r from-red-500 to-orange-500',
      badge: 'bg-red-50 text-red-700 border-red-200',
    },
  },
  'Alamat tidak ditemukan': {
    type: 'other',
    icon: 'map-pin',
    theme: {
      border: 'border-emerald-300',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      accent: 'bg-gradient-to-r from-emerald-500 to-green-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  },
  'Macet Total': {
    type: 'weather',
    icon: 'cloud-rain',
    theme: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      accent: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  },
};

const DEFAULT_ALERT_STYLE: AlertStyle = {
  type: 'other',
  icon: 'alert-triangle',
  theme: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    accent: 'bg-gradient-to-r from-red-500 to-orange-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
};

function relativeTime(iso: string): string {
  const diffMs = operationalNowMs() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Baru Saja';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru Saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function mapIncidentAlert(incident: IncidentReport): IncidentAlert {
  const category = incident.incidentCategory ?? '';
  const style = ALERT_STYLES[category] ?? DEFAULT_ALERT_STYLE;

  return {
    id: incident.id,
    type: style.type,
    title: ALERT_STYLES[category] ? category : incident.kendala,
    description: incident.kendalaDetail ?? incident.kendala,
    waybillNumber: incident.waybillNumber,
    severity: incident.severity,
    courierName: incident.courier.name,
    location: incident.stoppedLocation,
    timestamp: relativeTime(incident.reportedAt),
    icon: style.icon,
    theme: style.theme,
  };
}

// ─── Audit log ───────────────────────────────────────────────────────────────

const REPORT_STATUSES: ReportStatus[] = ['Dialihkan', 'Eskalasi', 'Selesai'];

function mapReportStatus(status: string | null | undefined): ReportStatus {
  const found = REPORT_STATUSES.find(
    (candidate) => candidate.toLowerCase() === (status ?? '').trim().toLowerCase(),
  );
  return found ?? 'Selesai';
}

export function mapAuditLog(raw: RawAuditLog): AuditLogEntry {
  return {
    id: raw.id,
    logCode: raw.log_code,
    resi: raw.resi ?? '',
    serviceType: raw.service_type,
    completedAt: raw.completed_at,
    fromCourier: raw.from_courier ?? '',
    fromCourierCode: raw.from_courier_code ?? '',
    toCourier: raw.to_courier ?? '',
    toCourierCode: raw.to_courier_code ?? '',
    incidentCategory: raw.incident_category ?? '',
    incidentDetail: raw.incident_detail ?? '',
    reportStatus: mapReportStatus(raw.report_status),
    handlingSeconds: raw.handling_seconds,
    slaCompliant: raw.sla_compliant,
    executorName: raw.executor_name ?? undefined,
    evidenceImageUrl: raw.evidence_image_url ?? '',
    evidencePublicId: raw.evidence_public_id ?? undefined,
    evidenceCaption: raw.evidence_caption ?? undefined,
  };
}

export function mapAuditLogs(raw: RawAuditLog[]): AuditLogEntry[] {
  return dedupeBy(raw, (log) => log.id).map(mapAuditLog);
}

export function mapAuditKpi(summary: RawAuditSummary | undefined, logs: AuditLogEntry[]): AuditKpi {
  if (summary) {
    return {
      totalCompleted: summary.total_completed,
      avgHandlingSeconds: summary.avg_handling_seconds,
      slaComplianceRate: summary.sla_compliance_rate,
      slaCompliantCount: summary.sla_compliant_count,
    };
  }
  const total = logs.length;
  const compliant = logs.filter((log) => log.slaCompliant).length;
  return {
    totalCompleted: total,
    avgHandlingSeconds: total
      ? Math.round(logs.reduce((sum, log) => sum + log.handlingSeconds, 0) / total)
      : 0,
    slaComplianceRate: total ? (compliant / total) * 100 : 0,
    slaCompliantCount: compliant,
  };
}

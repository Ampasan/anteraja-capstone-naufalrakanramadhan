/**
 * Pemetaan payload backend (snake_case) ke tipe yang dipakai komponen UI
 * (camelCase).
 *
 * Satu berkas ini adalah satu-satunya tempat yang "mengetahui" kontrak API,
 * sehingga perubahan nama field di backend cukup diperbaiki di sini.
 */

import type {
  ActivePackage,
  ColdChainAnomaly,
  Courier,
  EmergencyReassignPayload,
  Hub,
  IncidentAlert,
} from '../features/monitoring/types';
import type { CandidateCourier, IncidentReport } from '../features/incidents/types';
import type { AuditKpi, AuditLogEntry } from '../features/audit-logs/types';
import type { CargoDetail, HazardAnalysis, SlaOrder, TimelineStep } from '../features/sla-risk/types';

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
  position: LatLon;
  telemetry?: RawTelemetry | null;
  hub_position: LatLon;
}

export interface RawCourierPackage {
  waybill_number: string;
  service_type: string;
  weight_kg: number;
  recipient_name: string;
  destination_address: string;
  drop_lat: number;
  drop_lng: number;
  sla_deadline: string;
  delivery_status: string;
}

export interface RawCourierDetail extends Omit<RawCourier, 'position' | 'hub_position'> {
  position?: LatLon;
  hub_position?: LatLon;
  active_packages?: RawCourierPackage[];
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
  kendala: string;
  kendala_detail?: string | null;
  incident_category?: string | null;
  stopped_location: string;
  destination: string;
  muatan: string;
  weight_kg: number;
  reported_at: string;
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
  resi: string;
  service_type: string;
  completed_at: string;
  from_courier: string;
  from_courier_code?: string | null;
  to_courier: string;
  to_courier_code?: string | null;
  incident_category: string;
  incident_detail?: string | null;
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
  return Math.round((target - Date.now()) / 60000);
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toLatLon(point: LatLon | undefined | null): LatLon {
  return { lat: point?.lat ?? 0, lng: point?.lng ?? 0 };
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

// ─── Paket aktif (dari panel SLA) ────────────────────────────────────────────

export function mapActivePackage(order: RawOrder): ActivePackage {
  return {
    waybillNumber: order.waybill_number,
    serviceType: order.service_type,
    weightKg: order.weight_kg,
    // API tidak mengirim nama penerima — alamat tujuan dipakai sebagai pengganti
    // yang tetap berguna untuk operator.
    recipientName: order.destination_name,
    recipientAddress: order.destination_area,
    dropLat: order.drop_lat,
    dropLng: order.drop_lng,
    slaRemainingMinutes: order.remaining_minutes,
    slaElapsedPct: order.elapsed_pct,
  };
}

function groupOrdersByCourier(orders: RawOrder[]): Map<string, RawOrder[]> {
  const map = new Map<string, RawOrder[]>();
  for (const order of orders) {
    const list = map.get(order.courier_id);
    if (list) list.push(order);
    else map.set(order.courier_id, [order]);
  }
  return map;
}

/** Anomali cold-chain: layanan Frozen bersuhu di atas 5 °C (FRD-01). */
function findColdChainAnomaly(orders: RawOrder[] | undefined): ColdChainAnomaly | undefined {
  const anomaly = orders?.find(
    (o) => o.service_type === 'Frozen' && typeof o.temperature_c === 'number' && o.temperature_c > 5,
  );
  if (!anomaly || typeof anomaly.temperature_c !== 'number') return undefined;
  return {
    waybillNumber: anomaly.waybill_number,
    currentTempC: anomaly.temperature_c,
    maxAllowedTempC: 5,
    detectedAt: 'Baru Saja',
  };
}

function buildRoute(courier: RawCourier, packages: ActivePackage[]) {
  if (packages.length === 0) return undefined;
  const polyline: LatLon[] = [toLatLon(courier.hub_position), courier.position];
  for (const pkg of packages) polyline.push({ lat: pkg.dropLat, lng: pkg.dropLng });
  const nearest = packages.reduce((min, p) => Math.min(min, p.slaRemainingMinutes), Infinity);
  return {
    polyline,
    eta: Number.isFinite(nearest) ? `${Math.max(0, nearest)} mnt` : '—',
  };
}

/**
 * Gabungkan daftar kurir dengan paket aktifnya.
 * `current_parcel_count` dari API dipakai sebagai jumlah paket pada kartu
 * karena daftar order hanya memuat paket yang sedang dipantau SLA.
 */
export function mapCouriers(raw: RawCourier[], orders: RawOrder[]): Courier[] {
  const byCourier = groupOrdersByCourier(orders);

  return raw.map((c) => {
    const ordersOfCourier = byCourier.get(c.id);
    const activePackages = (ordersOfCourier ?? []).map(mapActivePackage);

    return {
      id: c.id,
      name: c.name,
      initials: c.initials,
      status: c.status === 'ONLINE' || c.status === 'IDLE' ? c.status : 'IDLE',
      vehicle: c.vehicle_type,
      position: toLatLon(c.position),
      hubPosition: toLatLon(c.hub_position),
      activePackages,
      parcelCount: c.current_parcel_count,
      capacityTotal: c.max_parcel_count,
      idleDuration: c.idle_duration ?? undefined,
      lastKnownAddress: c.current_address ?? undefined,
      route: buildRoute(c, activePackages),
      coldChainAnomaly: findColdChainAnomaly(ordersOfCourier),
      phone: c.phone_number,
    };
  });
}

/** Detail satu kurir (daftar paket + nama penerima sesungguhnya). */
export function mapCourierDetail(
  raw: RawCourierDetail,
  base: Courier | undefined,
  orders: RawOrder[],
): Courier {
  const ordersByWaybill = new Map(orders.map((o) => [o.waybill_number, o]));

  const activePackages: ActivePackage[] = (raw.active_packages ?? []).map((pkg) => {
    const sla = ordersByWaybill.get(pkg.waybill_number);
    const remaining = sla ? sla.remaining_minutes : minutesUntil(pkg.sla_deadline);
    // Estimasi pemakaian waktu bila baris SLA tidak tersedia (skala 0–100%).
    const elapsed = sla
      ? sla.elapsed_pct
      : clamp(Math.round(((120 - Math.max(0, remaining)) / 120) * 100), 0, 100);

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

  const hubPosition = base?.hubPosition ?? toLatLon(raw.hub_position);
  const position = base?.position ?? toLatLon(raw.position);

  const anomalyOrder = activePackages
    .map((pkg) => ordersByWaybill.get(pkg.waybillNumber))
    .find(
      (order) =>
        !!order &&
        order.service_type === 'Frozen' &&
        typeof order.temperature_c === 'number' &&
        order.temperature_c > 5,
    );

  const coldChainAnomaly: ColdChainAnomaly | undefined =
    anomalyOrder && typeof anomalyOrder.temperature_c === 'number'
      ? {
          waybillNumber: anomalyOrder.waybill_number,
          currentTempC: anomalyOrder.temperature_c,
          maxAllowedTempC: 5,
          detectedAt: 'Baru Saja',
        }
      : undefined;

  return {
    id: raw.id,
    name: raw.name,
    initials: raw.initials,
    status: raw.status === 'ONLINE' || raw.status === 'IDLE' ? raw.status : 'IDLE',
    vehicle: raw.vehicle_type,
    position,
    hubPosition,
    activePackages,
    parcelCount: raw.current_parcel_count,
    capacityTotal: raw.max_parcel_count,
    idleDuration: raw.idle_duration ?? undefined,
    lastKnownAddress: raw.current_address ?? undefined,
    route: activePackages.length
      ? {
          polyline: [hubPosition, position, ...activePackages.map((p) => ({ lat: p.dropLat, lng: p.dropLng }))],
          eta: `${Math.max(0, Math.min(...activePackages.map((p) => p.slaRemainingMinutes)))} mnt`,
        }
      : undefined,
    coldChainAnomaly,
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

function trafficColor(traffic: string | null | undefined): 'green' | 'amber' | 'red' {
  const value = (traffic ?? '').toLowerCase();
  if (!value) return 'green';
  if (value.includes('macet') || value.includes('total') || value.includes('padat') || value.includes('parah')) {
    return 'red';
  }
  if (value.includes('sedang') || value.includes('ramai')) return 'amber';
  return 'green';
}

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} WIB`;
}

function buildTimeline(order: RawOrder): TimelineStep[] {
  const remaining = order.remaining_minutes;
  const isLate = remaining <= 0;

  return [
    {
      status: 'done',
      title: 'Paket berangkat dari Hub Halim',
      subtitle: `Manifest ${order.waybill_number} • Kurir ${order.courier_name}`,
      time: '',
    },
    {
      status: 'done',
      title: 'Dalam perjalanan ke tujuan',
      subtitle: `${order.weather_condition ?? 'Cuaca normal'} • ${order.traffic_condition ?? 'Lalu lintas lancar'}`,
      time: '',
      badge: isLate ? 'SLA terlewati' : `Sisa ${remaining} menit`,
      badgeColor: isLate ? 'red' : remaining <= 15 ? 'amber' : 'green',
    },
    {
      status: isLate ? 'done' : 'pending',
      title: 'Estimasi tiba di tujuan',
      subtitle: order.destination_area,
      time: '',
      etaBadge: `${formatClock(order.sla_deadline)} (${isLate ? 'lewat' : `sisa ${remaining} menit`})`,
    },
  ];
}

function buildHazard(order: RawOrder): HazardAnalysis {
  const score =
    typeof order.sla_risk_score === 'number'
      ? order.sla_risk_score
      : Number(clamp(order.elapsed_pct / 10, 0, 10).toFixed(1));
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

  const detail: CargoDetail = {
    courierId: order.courier_code,
    vehicleType: courier?.vehicle_type ?? '—',
    loadUsedKg: courier?.current_load_kg ?? 0,
    loadCapacityKg: courier?.max_capacity_kg || Math.max(courier?.current_load_kg ?? 0, 1),
    destinationName: order.destination_name,
    destinationAddress: order.destination_area,
    weightKg: order.weight_kg,
    cargoClassification: cargoClassification(order.service_type),
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
  return orders.map((order) => mapSlaOrder(order, couriersById));
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
  return raw.map(mapIncident);
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
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Baru Saja';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru Saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function mapIncidentAlert(incident: IncidentReport): IncidentAlert {
  const style = ALERT_STYLES[incident.incidentCategory ?? ''] ?? DEFAULT_ALERT_STYLE;

  return {
    id: incident.id,
    type: style.type,
    title: incident.kendala,
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

// ─── Payload modal pengalihan darurat dari peta ──────────────────────────────

export function mapEmergencyPayload(
  incident: IncidentReport,
  hubPosition: { lat: number; lng: number },
): EmergencyReassignPayload {
  const isColdChain = incident.serviceType === 'Frozen';
  const anomaly: ColdChainAnomaly | undefined =
    typeof incident.temperatureC === 'number' && isColdChain
      ? {
          waybillNumber: incident.waybillNumber,
          currentTempC: incident.temperatureC,
          maxAllowedTempC: 5,
          detectedAt: 'Baru Saja',
        }
      : undefined;

  return {
    anomaly,
    description: incident.kendalaDetail ?? incident.kendala,
    incidentId: incident.id,
    waybillNumber: incident.waybillNumber,
    originalCourier: {
      id: incident.courier.id,
      name: incident.courier.name,
      initials:
        incident.courier.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'KU',
      vehicle: incident.courier.vehicleType,
      obstacleLabel: incident.trafficCondition ?? incident.kendala,
      lastKnownAddress: incident.stoppedLocation,
    },
    candidates: incident.candidates.map((candidate) => {
      const current = candidate.currentParcels ?? 0;
      const total = candidate.maxParcels ?? current;
      return {
        id: candidate.id,
        name: candidate.name,
        initials: candidate.initials,
        etaMinutes: candidate.etaMinutes,
        distanceLabel: formatDistance(candidate.distanceM),
        loadCurrent: current,
        loadTotal: Math.max(total, current, 1),
        isBest: candidate.isRecommended,
      };
    }),
    hubPosition,
  };
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export function mapAuditLog(raw: RawAuditLog): AuditLogEntry {
  return {
    id: raw.id,
    logCode: raw.log_code,
    resi: raw.resi,
    serviceType: raw.service_type,
    completedAt: raw.completed_at,
    fromCourier: raw.from_courier,
    fromCourierCode: raw.from_courier_code ?? '',
    toCourier: raw.to_courier,
    toCourierCode: raw.to_courier_code ?? '',
    incidentCategory: raw.incident_category,
    incidentDetail: raw.incident_detail ?? '',
    handlingSeconds: raw.handling_seconds,
    slaCompliant: raw.sla_compliant,
    executorName: raw.executor_name ?? undefined,
    evidenceImageUrl: raw.evidence_image_url ?? '',
    evidencePublicId: raw.evidence_public_id ?? undefined,
    evidenceCaption: raw.evidence_caption ?? undefined,
  };
}

export function mapAuditLogs(raw: RawAuditLog[]): AuditLogEntry[] {
  return raw.map(mapAuditLog);
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

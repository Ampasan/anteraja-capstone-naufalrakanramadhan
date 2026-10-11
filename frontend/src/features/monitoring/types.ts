export type CourierStatus = 'ONLINE' | 'IDLE' | 'ALERT';

/** Jenis layanan pengiriman. Backend mengirim label bebas ("Instant", "Cargo", ...). */
export type ServiceType = string;

/** Jenis armada. Backend memakai label bebas ("Motorcycle", "Truk Box", ...). */
export type VehicleType = string;

/** GPS coordinate pair */
export interface LatLng {
  lat: number;
  lng: number;
}

/** A package/parcel currently assigned to a courier */
export interface ActivePackage {
  waybillNumber: string;
  serviceType: ServiceType;
  weightKg: number;
  recipientName: string;
  recipientAddress: string;
  dropLat: number;
  dropLng: number;
  slaRemainingMinutes: number;
  slaElapsedPct: number;
}

/** Anomaly data attached to a cold-chain package */
export interface ColdChainAnomaly {
  waybillNumber: string;
  currentTempC: number;
  maxAllowedTempC: number;
  detectedAt: string; // e.g. "Baru Saja"
}

/** Route polyline for the active delivery */
export interface ActiveRoute {
  polyline: LatLng[];
  eta: string;
  /**
   * `true` bila `polyline` sudah berupa geometri jaringan jalan, bukan garis
   * lurus tujuan. RoadPolyline lalu menggambar apa adanya tanpa memanggil OSRM.
   */
  snapped?: boolean;
}

/** Full courier entity used across the monitoring feature */
export interface Courier {
  id: string;
  name: string;
  initials: string;
  status: CourierStatus;
  vehicle: VehicleType;
  position: LatLng;
  hubPosition: LatLng;
  activePackages: ActivePackage[];
  /** Jumlah paket aktif menurut backend (bisa lebih banyak dari daftar SLA). */
  parcelCount?: number;
  capacityTotal: number;
  idleDuration?: string;
  lastKnownAddress?: string;
  /** Kecepatan telemetri terakhir dalam km/j. Basis laju penanda bergerak di peta. */
  speedKmh?: number;
  /** Jarak lurus ke hub dalam meter, dihitung dari posisi yang sedang ditampilkan. */
  distanceFromHubM?: number;
  /** Masih di dalam radius layan hub? null bila jaraknya belum diketahui. */
  insideRadius?: boolean;
  /** Radius layan hub dalam km — dipakai untuk label di UI. */
  hubRadiusKm?: number;
  route?: ActiveRoute;
  coldChainAnomaly?: ColdChainAnomaly;
  phone: string;
}

/** A hub / sortation center */
export interface Hub {
  id: string;
  name: string;
  shortName: string;
  position: LatLng;
  radiusKm: number;
  capacityUsed: number;
  capacityTotal: number;
}

/** UI filter tabs for courier list */
export type CourierFilter = 'all' | 'online' | 'idle';

/** Generic incident type for toast notifications */
export type IncidentType = 'cold-chain' | 'vehicle-breakdown' | 'weather' | 'traffic' | 'other';

/** Generic incident alert for toast notifications */
export interface IncidentAlert {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  waybillNumber: string;
  severity: 'CRITICAL' | 'WARNING' | 'SAFE';
  courierName: string;
  location: string;
  timestamp: string;
  icon: 'snowflake' | 'wrench' | 'cloud-rain' | 'alert-triangle' | 'package' | 'map-pin';
  theme: {
    border: string;
    bg: string;
    iconBg: string;
    iconColor: string;
    accent: string;
    badge: string;
  };
}

export type CourierStatus = 'ONLINE' | 'IDLE' | 'ALERT';

export type ServiceType =
  | 'Same Day'
  | 'Next Day'
  | 'Regular'
  | 'Instant'
  | 'Frozen'
  | 'PHARMA'
  | 'Cargo'
  | 'Mini Cargo'
  | 'Dokumen';

export type VehicleType = 'Motor' | 'Van' | 'Pick Up Box' | 'Blind Van';

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
  capacityTotal: number;
  idleDuration?: string;
  lastKnownAddress?: string;
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

/** Candidate courier for emergency reassignment */
export interface ReassignmentCandidate {
  id: string;
  name: string;
  initials: string;
  etaMinutes: number;
  distanceLabel: string;
  loadCurrent: number;
  loadTotal: number;
  isBest: boolean;
}

/** Payload for the emergency reassignment modal */
export interface EmergencyReassignPayload {
  anomaly: ColdChainAnomaly;
  originalCourier: {
    id: string;
    name: string;
    initials: string;
    vehicle: VehicleType;
    obstacleLabel: string;
    lastKnownAddress: string;
  };
  candidates: ReassignmentCandidate[];
}

/** UI filter tabs for courier list */
export type CourierFilter = 'all' | 'online' | 'idle';

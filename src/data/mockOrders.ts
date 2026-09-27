export type ServiceType =
  | 'Instant'
  | 'Same Day'
  | 'Next Day'
  | 'Regular'
  | 'Dokumen'
  | 'Cargo'
  | 'Mini Cargo'
  | 'PHARMA'
  | 'Frozen';

export type SlaRisk = 'Kritis' | 'Waspada' | 'Aman';

export type ConditionKey =
  | 'heavy-rain-traffic'
  | 'temp-box'
  | 'light-rain'
  | 'crowded'
  | 'normal-sunny'
  | 'road-clear';

export interface OrderCondition {
  key: ConditionKey;
  label: string;
}

export type TimelineStatus = 'done' | 'pending';

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
  slaRiskScore: number; // 0.0 – 10.0
  slaRiskLabel: string; // e.g. "Sangat Rendah"
  slaRiskColor: 'green' | 'amber' | 'red';
}

export interface CargoDetail {
  courierId: string;
  vehicleType: string;
  loadUsedKg: number;
  loadCapacityKg: number;
  destinationName: string;
  destinationAddress: string;
  weightKg: number;
  dimensionCm: string; // "80×60×75 cm"
  volumeCbm: string;   // "0.36 CBM"
  cargoClassification: string;
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

export interface Order {
  waybillNumber: string;
  courierId: string;
  serviceType: string;
  weightKg: number;
  slaDeadline: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'REASSIGNED';
  originLat: number;
  originLng: number;
  dropLat: number;
  dropLng: number;
}

export const mockSlaOrders: SlaOrder[] = [
  {
    waybillNumber: '100024000888',
    courierId: 'STR-JKT-008',
    serviceType: 'Instant',
    weightKg: 0.5,
    slaDeadline: '2026-09-27T14:12:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8346,  dropLng: 106.8318,
    destinationName: 'Jl. Ir. H. Djuanda No. 120',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'heavy-rain-traffic', label: 'Hujan lebat & macet' },
    slaRemainingMin: 12,
    slaRisk: 'Kritis',
    detail: {
      courierId: 'STR-JKT-008',
      vehicleType: 'Motor',
      loadUsedKg: 3,
      loadCapacityKg: 15,
      destinationName: 'Jl. Ir. H. Djuanda No. 120',
      destinationAddress: 'Jl. Ir. H. Djuanda No. 120, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12430',
      weightKg: 0.5,
      dimensionCm: '20×15×10 cm',
      volumeCbm: '0.003 CBM',
      cargoClassification: 'Dokumen Cepat',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate A-01 • Manifest #MNF-TB-00021',
          time: '13:45 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Mampang',
          subtitle: 'Sensor Telemetri Koridor Mampang Prapatan',
          time: '13:52 WIB',
          badge: 'Kecepatan 18 km/jam • Macet',
          badgeColor: 'red',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Cilandak',
          subtitle: 'Jarak tersisa 4.1 KM • Kondisi hujan lebat',
          time: '',
          etaBadge: '14:12 WIB (Sisa 12 Menit)',
        },
      ],
      hazard: {
        weather: 'Hujan Lebat',
        traffic: 'Macet Parah (Merah)',
        trafficColor: 'red',
        slaRiskScore: 8.7,
        slaRiskLabel: 'Sangat Tinggi',
        slaRiskColor: 'red',
      },
    },
  },

  {
    waybillNumber: '100024000108',
    courierId: 'STR-JKT-011',
    serviceType: 'Frozen',
    weightKg: 4.2,
    slaDeadline: '2026-09-27T14:14:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8178,  dropLng: 106.8488,
    destinationName: 'Jl. Cipete Raya No. 42',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'temp-box', label: 'Suhu Box: 3.8°C' },
    slaRemainingMin: 14,
    slaRisk: 'Kritis',
    detail: {
      courierId: 'STR-JKT-011',
      vehicleType: 'Motor Box Pendingin',
      loadUsedKg: 12,
      loadCapacityKg: 20,
      destinationName: 'Jl. Cipete Raya No. 42',
      destinationAddress: 'Jl. Cipete Raya No. 42, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12410',
      weightKg: 4.2,
      dimensionCm: '30×25×20 cm',
      volumeCbm: '0.015 CBM',
      cargoClassification: 'Produk Beku / Cold Chain',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Cold Storage Gate C-02 • Manifest #MNF-TB-00089',
          time: '13:40 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Fatmawati',
          subtitle: 'Sensor Telemetri Koridor Fatmawati – Cipete',
          time: '13:55 WIB',
          badge: 'Kecepatan 22 km/jam • Padat',
          badgeColor: 'amber',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Cipete',
          subtitle: 'Jarak tersisa 2.8 KM • Suhu box perlu dijaga ≤4°C',
          time: '',
          etaBadge: '14:14 WIB (Sisa 14 Menit)',
        },
      ],
      hazard: {
        weather: 'Berawan',
        traffic: 'Padat (Kuning)',
        trafficColor: 'amber',
        slaRiskScore: 7.9,
        slaRiskLabel: 'Tinggi',
        slaRiskColor: 'red',
      },
    },
  },

  {
    waybillNumber: '100024000254',
    courierId: 'STR-JKT-005',
    serviceType: 'Same Day',
    weightKg: 1.8,
    slaDeadline: '2026-09-27T14:18:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8290,  dropLng: 106.8370,
    destinationName: 'Jl. Prof. DR. Soepomo No. 88',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'light-rain', label: 'Hujan Ringan' },
    slaRemainingMin: 18,
    slaRisk: 'Waspada',
    detail: {
      courierId: 'STR-JKT-005',
      vehicleType: 'Motor',
      loadUsedKg: 7,
      loadCapacityKg: 15,
      destinationName: 'Jl. Prof. DR. Soepomo No. 88',
      destinationAddress: 'Jl. Prof. DR. Soepomo No. 88, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12420',
      weightKg: 1.8,
      dimensionCm: '35×25×15 cm',
      volumeCbm: '0.013 CBM',
      cargoClassification: 'Paket Reguler',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate A-03 • Manifest #MNF-TB-00134',
          time: '13:30 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Duren Tiga',
          subtitle: 'Sensor Telemetri Koridor Duren Tiga – Soepomo',
          time: '13:48 WIB',
          badge: 'Kecepatan 28 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Cilandak',
          subtitle: 'Jarak tersisa 3.2 KM • Hujan ringan, kondisi terpantau',
          time: '',
          etaBadge: '14:18 WIB (Sisa 18 Menit)',
        },
      ],
      hazard: {
        weather: 'Hujan Ringan',
        traffic: 'Lancar (Hijau)',
        trafficColor: 'green',
        slaRiskScore: 4.2,
        slaRiskLabel: 'Sedang',
        slaRiskColor: 'amber',
      },
    },
  },

  {
    waybillNumber: '100024000411',
    courierId: 'STR-JKT-017',
    serviceType: 'PHARMA',
    weightKg: 2.5,
    slaDeadline: '2026-09-27T14:24:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8219,  dropLng: 106.8408,
    destinationName: 'RS Tebet Medical Center',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'crowded', label: 'Cawang Padat' },
    slaRemainingMin: 24,
    slaRisk: 'Waspada',
    detail: {
      courierId: 'STR-JKT-017',
      vehicleType: 'Motor Farmasi',
      loadUsedKg: 8,
      loadCapacityKg: 15,
      destinationName: 'RS Tebet Medical Center',
      destinationAddress: 'Jl. Tebet Raya No. 57, Tebet, Kota Jakarta Selatan, DKI Jakarta 12810',
      weightKg: 2.5,
      dimensionCm: '25×20×15 cm',
      volumeCbm: '0.008 CBM',
      cargoClassification: 'Obat-obatan / Farmasi',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Pharma Gate P-01 • Manifest #MNF-TB-00202',
          time: '13:20 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Cawang',
          subtitle: 'Sensor Telemetri Koridor Cawang – Tebet',
          time: '13:40 WIB',
          badge: 'Kecepatan 15 km/jam • Padat',
          badgeColor: 'amber',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di RS Tebet',
          subtitle: 'Jarak tersisa 3.8 KM • Kepadatan lalu lintas aktif',
          time: '',
          etaBadge: '14:24 WIB (Sisa 24 Menit)',
        },
      ],
      hazard: {
        weather: 'Berawan Sebagian',
        traffic: 'Padat (Kuning)',
        trafficColor: 'amber',
        slaRiskScore: 5.1,
        slaRiskLabel: 'Sedang',
        slaRiskColor: 'amber',
      },
    },
  },

  {
    waybillNumber: '100024000529',
    courierId: 'ST-TBT-042',
    serviceType: 'Cargo',
    weightKg: 180,
    slaDeadline: '2026-09-27T14:45:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8195,  dropLng: 106.8258,
    destinationName: 'Gudang Logistik Pancoran',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'normal-sunny', label: 'Normal Cerah' },
    slaRemainingMin: 45,
    slaRisk: 'Aman',
    detail: {
      courierId: 'ST-TBT-042',
      vehicleType: 'Truk',
      loadUsedKg: 320,
      loadCapacityKg: 450,
      destinationName: 'Gudang Logistik Pancoran',
      destinationAddress: 'Jl. Pasar Minggu Raya No. 12, Pancoran, Kota Jakarta Selatan, DKI Jakarta 12780',
      weightKg: 180,
      dimensionCm: '80×60×75 cm',
      volumeCbm: '0.36 CBM',
      cargoClassification: 'Furnitur',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate B-04 • Manifest #MNF-TB-89201',
          time: '13:10 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Pancoran',
          subtitle: 'Sensor Telemetri Koridor Korlantas MT Haryono – Pasar Minggu',
          time: '13:45 WIB',
          badge: 'Kecepatan 34 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Gudang Tujuan',
          subtitle: 'Jarak tersisa 2.3 KM • Bebas hambatan kontingensi',
          time: '',
          etaBadge: '14:32 WIB (Sisa 45 Menit)',
        },
      ],
      hazard: {
        weather: 'Normal Cerah',
        traffic: 'Lancar (Hijau)',
        trafficColor: 'green',
        slaRiskScore: 0.4,
        slaRiskLabel: 'Sangat Rendah',
        slaRiskColor: 'green',
      },
    },
  },

  {
    waybillNumber: '100024000678',
    courierId: 'STR-JKT-022',
    serviceType: 'Dokumen',
    weightKg: 0.2,
    slaDeadline: '2026-09-27T14:58:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8140,  dropLng: 106.8350,
    destinationName: 'Menara Bidakara Lt. 15',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'road-clear', label: 'Jalanan Lancar' },
    slaRemainingMin: 58,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-022',
      vehicleType: 'Motor',
      loadUsedKg: 1,
      loadCapacityKg: 15,
      destinationName: 'Menara Bidakara Lt. 15',
      destinationAddress: 'Jl. Jend. Gatot Subroto Kav. 71-73, Pancoran, Kota Jakarta Selatan, DKI Jakarta 12870',
      weightKg: 0.2,
      dimensionCm: '30×22×2 cm',
      volumeCbm: '0.001 CBM',
      cargoClassification: 'Dokumen Legal',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate A-02 • Manifest #MNF-TB-00312',
          time: '13:55 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Gatot Subroto',
          subtitle: 'Sensor Telemetri Koridor MT Haryono – Gatot Subroto',
          time: '14:05 WIB',
          badge: 'Kecepatan 42 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Menara Bidakara',
          subtitle: 'Jarak tersisa 1.9 KM • Kondisi jalur bebas hambatan',
          time: '',
          etaBadge: '14:58 WIB (Sisa 58 Menit)',
        },
      ],
      hazard: {
        weather: 'Cerah Berawan',
        traffic: 'Lancar (Hijau)',
        trafficColor: 'green',
        slaRiskScore: 0.8,
        slaRiskLabel: 'Sangat Rendah',
        slaRiskColor: 'green',
      },
    },
  },

  {
    waybillNumber: '100024000781',
    courierId: 'STR-JKT-030',
    serviceType: 'Next Day',
    weightKg: 3.5,
    slaDeadline: '2026-09-27T15:15:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8310,  dropLng: 106.8430,
    destinationName: 'Apartemen Signature Park',
    destinationArea: 'Cilandak, Jakarta Selatan',
    condition: { key: 'normal-sunny', label: 'Normal Lancar' },
    slaRemainingMin: 75,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-030',
      vehicleType: 'Motor',
      loadUsedKg: 9,
      loadCapacityKg: 15,
      destinationName: 'Apartemen Signature Park',
      destinationAddress: 'Jl. MT Haryono Kav. 22, Tebet, Kota Jakarta Selatan, DKI Jakarta 12820',
      weightKg: 3.5,
      dimensionCm: '40×35×30 cm',
      volumeCbm: '0.042 CBM',
      cargoClassification: 'Elektronik',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate B-01 • Manifest #MNF-TB-00445',
          time: '13:25 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek MT Haryono',
          subtitle: 'Sensor Telemetri Koridor MT Haryono – Tebet',
          time: '13:50 WIB',
          badge: 'Kecepatan 38 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Signature Park',
          subtitle: 'Jarak tersisa 2.1 KM • Kondisi normal',
          time: '',
          etaBadge: '15:15 WIB (Sisa 75 Menit)',
        },
      ],
      hazard: {
        weather: 'Normal Cerah',
        traffic: 'Lancar (Hijau)',
        trafficColor: 'green',
        slaRiskScore: 1.2,
        slaRiskLabel: 'Sangat Rendah',
        slaRiskColor: 'green',
      },
    },
  },

  {
    waybillNumber: '100024000912',
    courierId: 'STR-JKT-041',
    serviceType: 'Regular',
    weightKg: 2.0,
    slaDeadline: '2026-09-27T15:40:00',
    status: 'IN_TRANSIT',
    originLat: -6.8249, originLng: 106.8502,
    dropLat: -6.8380,  dropLng: 106.8560,
    destinationName: 'Ruko Tebet Timur Dalam VI',
    destinationArea: 'Tebet Timur, Jakarta Selatan',
    condition: { key: 'road-clear', label: 'Normal Lancar' },
    slaRemainingMin: 100,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-041',
      vehicleType: 'Motor',
      loadUsedKg: 6,
      loadCapacityKg: 15,
      destinationName: 'Ruko Tebet Timur Dalam VI',
      destinationAddress: 'Jl. Tebet Timur Dalam VI No. 8, Tebet Timur, Kota Jakarta Selatan, DKI Jakarta 12820',
      weightKg: 2.0,
      dimensionCm: '35×28×20 cm',
      volumeCbm: '0.020 CBM',
      cargoClassification: 'Paket Reguler',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Tebet',
          subtitle: 'Sortation Gate A-04 • Manifest #MNF-TB-00518',
          time: '13:15 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Tebet Timur',
          subtitle: 'Sensor Telemetri Koridor Tebet Timur Dalam',
          time: '13:38 WIB',
          badge: 'Kecepatan 35 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Ruko Tebet Timur',
          subtitle: 'Jarak tersisa 1.4 KM • Bebas hambatan',
          time: '',
          etaBadge: '15:40 WIB (Sisa 100 Menit)',
        },
      ],
      hazard: {
        weather: 'Normal Cerah',
        traffic: 'Lancar (Hijau)',
        trafficColor: 'green',
        slaRiskScore: 0.6,
        slaRiskLabel: 'Sangat Rendah',
        slaRiskColor: 'green',
      },
    },
  },
];

export const mockOrders: Order[] = mockSlaOrders.map((o) => ({
  waybillNumber: o.waybillNumber,
  courierId: o.courierId,
  serviceType: o.serviceType,
  weightKg: o.weightKg,
  slaDeadline: o.slaDeadline,
  status: o.status,
  originLat: o.originLat,
  originLng: o.originLng,
  dropLat: o.dropLat,
  dropLng: o.dropLng,
}));

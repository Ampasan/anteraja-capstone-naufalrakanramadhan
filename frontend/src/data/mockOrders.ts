/** Jenis layanan pengiriman. Backend mengirim label bebas ("Instant", "Cargo", ...). */
export type ServiceType = string;

export type SlaRisk = string;

/** Kode kondisi perjalanan — backend mengirim slug bebas, jadi disimpan sebagai string. */
export type ConditionKey = string;

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
  dimensionCm?: string; // "80×60×75 cm" — tidak dikirim API, disembunyikan bila kosong
  volumeCbm?: string;   // "0.36 CBM"
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

// Hub Halim: Graha Intirub Gate 46, Kebon Pala, Makasar, Jakarta Timur
// Lat: -6.2651893, Lng: 106.8767953
const HUB_LAT = -6.2651893;
const HUB_LNG = 106.8767953;

export const mockSlaOrders: SlaOrder[] = [
  {
    // Instant — Dokumen Mendesak → Jl. Ir. H. Djuanda No. 120, Cawang
    waybillNumber: '100024000888',
    courierId: 'STR-JKT-008',
    serviceType: 'Instant',
    weightKg: 0.5,
    slaDeadline: '2026-09-27T14:12:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2432, dropLng: 106.8640,  // Cawang, Jakarta Timur
    destinationName: 'Jl. Ir. H. Djuanda No. 120, Cawang',
    destinationArea: 'Cawang, Jakarta Timur',
    condition: { key: 'heavy-rain-traffic', label: 'Hujan lebat & macet' },
    slaRemainingMin: 12,
    slaRisk: 'Kritis',
    detail: {
      courierId: 'STR-JKT-008',
      vehicleType: 'Motor',
      loadUsedKg: 3,
      loadCapacityKg: 15,
      destinationName: 'Jl. Ir. H. Djuanda No. 120, Cawang',
      destinationAddress: 'Jl. Ir. H. Djuanda No. 120, Cawang, Kramat Jati, Kota Jakarta Timur, DKI Jakarta 13630',
      weightKg: 0.5,
      dimensionCm: '20×15×10 cm',
      volumeCbm: '0.003 CBM',
      cargoClassification: 'Dokumen Cepat',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate A-01 • Manifest #MNF-HLM-00021',
          time: '13:45 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Cawang',
          subtitle: 'Sensor Telemetri Koridor Halim – Cawang',
          time: '13:52 WIB',
          badge: 'Kecepatan 18 km/jam • Macet',
          badgeColor: 'red',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Cawang',
          subtitle: 'Jarak tersisa 2.8 KM • Kondisi hujan lebat',
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
    // Frozen — Ikan Salmon Segar → Jl. Cipinang Muara, Jakarta Timur
    waybillNumber: '100024000108',
    courierId: 'STR-JKT-011',
    serviceType: 'Frozen',
    weightKg: 4.2,
    slaDeadline: '2026-09-27T14:14:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2318, dropLng: 106.9015,  // Cipinang Muara, Jakarta Timur
    destinationName: 'Jl. Cipinang Muara No. 42',
    destinationArea: 'Cipinang Muara, Jakarta Timur',
    condition: { key: 'temp-box', label: 'Suhu Box: 3.8°C' },
    slaRemainingMin: 14,
    slaRisk: 'Kritis',
    detail: {
      courierId: 'STR-JKT-011',
      vehicleType: 'Motor Box Pendingin',
      loadUsedKg: 12,
      loadCapacityKg: 20,
      destinationName: 'Jl. Cipinang Muara No. 42',
      destinationAddress: 'Jl. Cipinang Muara No. 42, Cipinang Muara, Jatinegara, Kota Jakarta Timur, DKI Jakarta 13420',
      weightKg: 4.2,
      dimensionCm: '30×25×20 cm',
      volumeCbm: '0.015 CBM',
      cargoClassification: 'Produk Beku / Cold Chain',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Cold Storage Gate C-02 • Manifest #MNF-HLM-00089',
          time: '13:40 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Duren Sawit',
          subtitle: 'Sensor Telemetri Koridor Halim – Duren Sawit – Cipinang',
          time: '13:55 WIB',
          badge: 'Kecepatan 22 km/jam • Padat',
          badgeColor: 'amber',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Cipinang Muara',
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
    // Same Day — Pakaian & Mode → Jl. Buaran Raya, Duren Sawit
    waybillNumber: '100024000254',
    courierId: 'STR-JKT-005',
    serviceType: 'Same Day',
    weightKg: 1.8,
    slaDeadline: '2026-09-27T14:18:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2215, dropLng: 106.9088,  // Duren Sawit, Jakarta Timur
    destinationName: 'Jl. Buaran Raya No. 88',
    destinationArea: 'Duren Sawit, Jakarta Timur',
    condition: { key: 'light-rain', label: 'Hujan Ringan' },
    slaRemainingMin: 18,
    slaRisk: 'Waspada',
    detail: {
      courierId: 'STR-JKT-005',
      vehicleType: 'Motor',
      loadUsedKg: 7,
      loadCapacityKg: 15,
      destinationName: 'Jl. Buaran Raya No. 88',
      destinationAddress: 'Jl. Buaran Raya No. 88, Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13440',
      weightKg: 1.8,
      dimensionCm: '35×25×15 cm',
      volumeCbm: '0.013 CBM',
      cargoClassification: 'Paket Reguler',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate A-03 • Manifest #MNF-HLM-00134',
          time: '13:30 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Klender',
          subtitle: 'Sensor Telemetri Koridor Cililitan – Klender – Duren Sawit',
          time: '13:48 WIB',
          badge: 'Kecepatan 28 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Duren Sawit',
          subtitle: 'Jarak tersisa 2.2 KM • Hujan ringan, kondisi terpantau',
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
    // PHARMA — Vaksin & Obat Resep → RS Islam Jakarta Timur
    waybillNumber: '100024000411',
    courierId: 'STR-JKT-017',
    serviceType: 'PHARMA',
    weightKg: 2.5,
    slaDeadline: '2026-09-27T14:24:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2488, dropLng: 106.9012,  // RS Islam Jakarta, Cempaka Putih Timur
    destinationName: 'RS Islam Jakarta Timur',
    destinationArea: 'Jatinegara, Jakarta Timur',
    condition: { key: 'crowded', label: 'Cawang Padat' },
    slaRemainingMin: 24,
    slaRisk: 'Waspada',
    detail: {
      courierId: 'STR-JKT-017',
      vehicleType: 'Motor Farmasi',
      loadUsedKg: 8,
      loadCapacityKg: 15,
      destinationName: 'RS Islam Jakarta Timur',
      destinationAddress: 'Jl. Jatinegara Barat No. 126, Jatinegara, Kota Jakarta Timur, DKI Jakarta 13310',
      weightKg: 2.5,
      dimensionCm: '25×20×15 cm',
      volumeCbm: '0.008 CBM',
      cargoClassification: 'Obat-obatan / Farmasi',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Pharma Gate P-01 • Manifest #MNF-HLM-00202',
          time: '13:20 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Cawang',
          subtitle: 'Sensor Telemetri Koridor Halim – Cawang – Jatinegara',
          time: '13:40 WIB',
          badge: 'Kecepatan 15 km/jam • Padat',
          badgeColor: 'amber',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di RS Islam Jakarta',
          subtitle: 'Jarak tersisa 3.1 KM • Kepadatan lalu lintas aktif',
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
    // Cargo — Elektronik Rumah Tangga → Gudang Logistik Pondok Kopi
    waybillNumber: '100024000529',
    courierId: 'ST-HLM-042',
    serviceType: 'Cargo',
    weightKg: 180,
    slaDeadline: '2026-09-27T14:45:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2172, dropLng: 106.9248,  // Pondok Kopi, Jakarta Timur
    destinationName: 'Gudang Logistik Pondok Kopi',
    destinationArea: 'Pondok Kopi, Jakarta Timur',
    condition: { key: 'normal-sunny', label: 'Normal Cerah' },
    slaRemainingMin: 45,
    slaRisk: 'Aman',
    detail: {
      courierId: 'ST-HLM-042',
      vehicleType: 'Truk',
      loadUsedKg: 320,
      loadCapacityKg: 450,
      destinationName: 'Gudang Logistik Pondok Kopi',
      destinationAddress: 'Jl. Pondok Kopi Raya No. 12, Pondok Kopi, Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13460',
      weightKg: 180,
      dimensionCm: '80×60×75 cm',
      volumeCbm: '0.36 CBM',
      cargoClassification: 'Elektronik Rumah Tangga',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate B-04 • Manifest #MNF-HLM-89201',
          time: '13:10 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Duren Sawit',
          subtitle: 'Sensor Telemetri Koridor Halim – Klender – Pondok Kopi',
          time: '13:45 WIB',
          badge: 'Kecepatan 34 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Gudang Tujuan',
          subtitle: 'Jarak tersisa 2.8 KM • Bebas hambatan kontingensi',
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
    // Dokumen — Kontrak Legal → Menara Bidakara, Duren Sawit
    waybillNumber: '100024000678',
    courierId: 'STR-JKT-022',
    serviceType: 'Dokumen',
    weightKg: 0.2,
    slaDeadline: '2026-09-27T14:58:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2388, dropLng: 106.8905,  // Jatinegara, Jakarta Timur
    destinationName: 'Graha Niaga Tower, Jatinegara',
    destinationArea: 'Jatinegara, Jakarta Timur',
    condition: { key: 'road-clear', label: 'Jalanan Lancar' },
    slaRemainingMin: 58,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-022',
      vehicleType: 'Motor',
      loadUsedKg: 1,
      loadCapacityKg: 15,
      destinationName: 'Graha Niaga Tower, Jatinegara',
      destinationAddress: 'Jl. Jend. Basuki Rachmat No. 71, Jatinegara, Kota Jakarta Timur, DKI Jakarta 13310',
      weightKg: 0.2,
      dimensionCm: '30×22×2 cm',
      volumeCbm: '0.001 CBM',
      cargoClassification: 'Dokumen Legal',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate A-02 • Manifest #MNF-HLM-00312',
          time: '13:55 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Cawang',
          subtitle: 'Sensor Telemetri Koridor Halim – Cawang – Jatinegara',
          time: '14:05 WIB',
          badge: 'Kecepatan 42 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Graha Niaga',
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
    // Next Day — Sepatu Olahraga → Apartemen Green Pramuka, Rawasari
    waybillNumber: '100024000781',
    courierId: 'STR-JKT-030',
    serviceType: 'Next Day',
    weightKg: 3.5,
    slaDeadline: '2026-09-27T15:15:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2522, dropLng: 106.8712,  // Kramat Jati, Jakarta Timur
    destinationName: 'Apartemen Green Pramuka',
    destinationArea: 'Kramat Jati, Jakarta Timur',
    condition: { key: 'normal-sunny', label: 'Normal Lancar' },
    slaRemainingMin: 75,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-030',
      vehicleType: 'Motor',
      loadUsedKg: 9,
      loadCapacityKg: 15,
      destinationName: 'Apartemen Green Pramuka',
      destinationAddress: 'Jl. Jend. Ahmad Yani No. 1, Rawasari, Cempaka Putih, Kota Jakarta Pusat, DKI Jakarta 10570',
      weightKg: 3.5,
      dimensionCm: '40×35×30 cm',
      volumeCbm: '0.042 CBM',
      cargoClassification: 'Elektronik',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate B-01 • Manifest #MNF-HLM-00445',
          time: '13:25 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Kramat Jati',
          subtitle: 'Sensor Telemetri Koridor Halim – Cililitan – Kramat Jati',
          time: '13:50 WIB',
          badge: 'Kecepatan 38 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Green Pramuka',
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
    // Regular — Buku & Alat Tulis → Ruko Jatinegara Timur
    waybillNumber: '100024000912',
    courierId: 'STR-JKT-041',
    serviceType: 'Regular',
    weightKg: 2.0,
    slaDeadline: '2026-09-27T15:40:00',
    status: 'IN_TRANSIT',
    originLat: HUB_LAT, originLng: HUB_LNG,
    dropLat: -6.2140, dropLng: 106.8980,  // Jatinegara Timur, Jakarta Timur
    destinationName: 'Ruko Jatinegara Timur Blok VI',
    destinationArea: 'Jatinegara Timur, Jakarta Timur',
    condition: { key: 'road-clear', label: 'Normal Lancar' },
    slaRemainingMin: 100,
    slaRisk: 'Aman',
    detail: {
      courierId: 'STR-JKT-041',
      vehicleType: 'Motor',
      loadUsedKg: 6,
      loadCapacityKg: 15,
      destinationName: 'Ruko Jatinegara Timur Blok VI',
      destinationAddress: 'Jl. Jatinegara Timur Blok VI No. 8, Jatinegara, Kota Jakarta Timur, DKI Jakarta 13310',
      weightKg: 2.0,
      dimensionCm: '35×28×20 cm',
      volumeCbm: '0.020 CBM',
      cargoClassification: 'Paket Reguler',
      timeline: [
        {
          status: 'done',
          title: 'Paket Diambil dari Hub Halim',
          subtitle: 'Sortation Gate A-04 • Manifest #MNF-HLM-00518',
          time: '13:15 WIB',
        },
        {
          status: 'done',
          title: 'Melewati Titik Cek Jatinegara',
          subtitle: 'Sensor Telemetri Koridor Cililitan – Jatinegara Timur',
          time: '13:38 WIB',
          badge: 'Kecepatan 35 km/jam • Lancar',
          badgeColor: 'green',
        },
        {
          status: 'pending',
          title: 'Estimasi Tiba di Ruko Jatinegara',
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

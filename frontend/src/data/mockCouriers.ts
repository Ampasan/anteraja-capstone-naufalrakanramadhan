import type { Courier, IncidentAlert } from '../features/monitoring/types';

// Hub Halim: Graha Intirub Gate 46, Kebon Pala, Makasar, Jakarta Timur
const HUB_POS = { lat: -6.2651893, lng: 106.8767953 };

export const mockCouriers: Courier[] = [
  {
    id: 'STR-JKT-001',
    name: 'Budi Santoso',
    initials: 'BD',
    status: 'ONLINE',
    vehicle: 'Motor',
    position: { lat: -6.2678, lng: 106.8812 },   // Area Cililitan, sedang mengantar
    hubPosition: HUB_POS,
    phone: '0812-1234-5678',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000000',
        serviceType: 'Same Day',
        weightKg: 1.4,
        recipientName: 'Ibu Ratna (Penerima)',
        recipientAddress: 'Jl. Gatot Subroto Kav. 22, Kramat Jati, Jakarta Timur',
        dropLat: -6.2610,
        dropLng: 106.8695,
        slaRemainingMinutes: 18,
        slaElapsedPct: 72,
      },
    ],
    route: {
      polyline: [
        { lat: -6.2651893, lng: 106.8767953 }, // Hub Halim
        { lat: -6.2658, lng: 106.8778 },
        { lat: -6.2665, lng: 106.8795 },
        { lat: -6.2678, lng: 106.8812 },         // posisi sekarang
        { lat: -6.2660, lng: 106.8785 },
        { lat: -6.2640, lng: 106.8760 },
        { lat: -6.2625, lng: 106.8735 },
        { lat: -6.2610, lng: 106.8695 },          // drop
      ],
      eta: '18 mnt',
    },
  },

  {
    id: 'STR-JKT-002',
    name: 'Rizky Pratama',
    initials: 'RP',
    status: 'ALERT',
    vehicle: 'Motor',
    position: { lat: -6.2712, lng: 106.8838 },   // Area Condet, anomali suhu
    hubPosition: HUB_POS,
    phone: '0813-9876-5432',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000009',
        serviceType: 'Frozen',
        weightKg: 2.1,
        recipientName: 'Resto Daging Sedap',
        recipientAddress: 'Jl. Condet Raya No. 18, Kramat Jati, Jakarta Timur',
        dropLat: -6.2748,
        dropLng: 106.8870,
        slaRemainingMinutes: 12,
        slaElapsedPct: 85,
      },
    ],
    coldChainAnomaly: {
      waybillNumber: '100024000009',
      currentTempC: 6.2,
      maxAllowedTempC: 5.0,
      detectedAt: 'Baru Saja',
    },
    route: {
      polyline: [
        { lat: -6.2651893, lng: 106.8767953 }, // Hub Halim
        { lat: -6.2672, lng: 106.8798 },
        { lat: -6.2692, lng: 106.8820 },
        { lat: -6.2712, lng: 106.8838 },         // posisi sekarang
        { lat: -6.2725, lng: 106.8850 },
        { lat: -6.2735, lng: 106.8860 },
        { lat: -6.2742, lng: 106.8866 },
        { lat: -6.2748, lng: 106.8870 },          // drop
      ],
      eta: '12 mnt',
    },
    lastKnownAddress: 'Jl. Condet Raya, Kramat Jati',
  },

  {
    id: 'STR-JKT-003',
    name: 'Rama Pratama',
    initials: 'RM',
    status: 'IDLE',
    vehicle: 'Motor',
    position: { lat: -6.2598, lng: 106.8730 },   // Area Jatinegara, idle
    hubPosition: HUB_POS,
    phone: '0856-1122-3344',
    capacityTotal: 20,
    idleDuration: '12m',
    lastKnownAddress: 'Jl. Jatinegara Kaum No. 88, Jatinegara',
    activePackages: [
      {
        waybillNumber: '100024000015',
        serviceType: 'Regular',
        weightKg: 0.8,
        recipientName: 'Bu Sari',
        recipientAddress: 'Jl. Jatinegara Barat No. 15, Jatinegara, Jakarta Timur',
        dropLat: -6.2562,
        dropLng: 106.8698,
        slaRemainingMinutes: 28,
        slaElapsedPct: 45,
      },
    ],
  },

  {
    id: 'STR-JKT-004',
    name: 'Doni Kurniawan',
    initials: 'DK',
    status: 'ONLINE',
    vehicle: 'Motor',
    position: { lat: -6.2622, lng: 106.8802 },   // Area Halim Perdanakusuma
    hubPosition: HUB_POS,
    phone: '0877-5544-3322',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000022',
        serviceType: 'Same Day',
        weightKg: 1.0,
        recipientName: 'Pak Bejo',
        recipientAddress: 'Jl. Halim Perdanakusuma No. 5, Makasar, Jakarta Timur',
        dropLat: -6.2590,
        dropLng: 106.8840,
        slaRemainingMinutes: 35,
        slaElapsedPct: 30,
      },
    ],
  },

  {
    id: 'STR-JKT-005',
    name: 'Hendra Wijaya',
    initials: 'HW',
    status: 'ONLINE',
    vehicle: 'Motor',
    position: { lat: -6.2540, lng: 106.8758 },   // Area Kampung Melayu
    hubPosition: HUB_POS,
    phone: '0822-9988-7766',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000031',
        serviceType: 'Regular',
        weightKg: 1.5,
        recipientName: 'Pak Joko',
        recipientAddress: 'Jl. Kampung Melayu Besar No. 9, Tebet, Jakarta Selatan',
        dropLat: -6.2515,
        dropLng: 106.8762,
        slaRemainingMinutes: 22,
        slaElapsedPct: 58,
      },
    ],
  },

  ...Array.from({ length: 33 }, (_, i) => {
    const idx = i + 6;
    const names = [
      'Agus Santoso', 'Bambang W.', 'Cahyo P.', 'Dedi S.', 'Eko Prasetyo',
      'Fajar M.', 'Gani R.', 'Hadi W.', 'Irwan S.', 'Joko P.',
      'Krisna D.', 'Lutfi A.', 'Miko S.', 'Nanda R.', 'Oki F.',
      'Pandu W.', 'Qodir A.', 'Rudi S.', 'Sandi P.', 'Tono A.',
      'Udin M.', 'Vino R.', 'Wahyu P.', 'Xandy S.', 'Yogi P.',
      'Zaki M.', 'Alfian R.', 'Beni S.', 'Candra P.', 'Dimas W.',
      'Erwin S.', 'Faris A.', 'Gilang P.',
    ];
    const name = names[i] ?? `Kurir ${idx}`;
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return {
      id: `STR-JKT-${String(idx).padStart(3, '0')}`,
      name,
      initials,
      status: 'ONLINE' as const,
      vehicle: 'Motor' as const,
      position: {
        // Scatter di sekitar Hub Halim (Jakarta Timur area)
        lat: -6.265 + (Math.sin(idx * 1.3) * 0.030),
        lng: 106.877 + (Math.cos(idx * 1.7) * 0.035),
      },
      hubPosition: HUB_POS,
      phone: `0811-${String(idx).padStart(4, '0')}-0000`,
      capacityTotal: 20,
      activePackages: [
        {
          waybillNumber: `10002400${String(idx * 3).padStart(4, '0')}`,
          serviceType: 'Regular' as const,
          weightKg: +(0.5 + Math.random() * 3).toFixed(1),
          recipientName: `Penerima ${idx}`,
          recipientAddress: `Jl. Cililitan No. ${idx}, Jakarta Timur`,
          dropLat: -6.265 + (Math.sin(idx) * 0.018),
          dropLng: 106.877 + (Math.cos(idx) * 0.018),
          slaRemainingMinutes: 20 + (idx % 40),
          slaElapsedPct: 30 + (idx % 50),
        },
      ],
    } satisfies Courier;
  }),
];

export const EMERGENCY_REASSIGN_PAYLOAD = {
  anomaly: mockCouriers[1].coldChainAnomaly!,
  originalCourier: {
    id: mockCouriers[1].id,
    name: mockCouriers[1].name,
    initials: mockCouriers[1].initials,
    vehicle: mockCouriers[1].vehicle,
    obstacleLabel: 'Macet Total',
    lastKnownAddress: mockCouriers[1].lastKnownAddress ?? 'Jl. Condet Raya, Kramat Jati',
  },
  candidates: [
    {
      id: mockCouriers[3].id,
      name: mockCouriers[3].name,
      initials: mockCouriers[3].initials,
      etaMinutes: 4,
      distanceLabel: '800 m',
      loadCurrent: 7,
      loadTotal: 20,
      isBest: true,
    },
    {
      id: mockCouriers[4].id,
      name: mockCouriers[4].name,
      initials: mockCouriers[4].initials,
      etaMinutes: 8,
      distanceLabel: '1.4 km',
      loadCurrent: 11,
      loadTotal: 20,
      isBest: false,
    },
  ],
};

export const INCIDENT_ALERTS: IncidentAlert[] = [
  {
    id: 'INC-001',
    type: 'cold-chain',
    title: 'Anomali Suhu Cold-Chain',
    description: 'melebihi batas aman frozen food (maks. 5°C)',
    waybillNumber: '100024000009',
    severity: 'WARNING',
    courierName: 'Rizky Pratama',
    location: 'Jl. Gatot Subroto',
    timestamp: 'Baru Saja',
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
  {
    id: 'INC-002',
    type: 'vehicle-breakdown',
    title: 'Kendaraan Mogok',
    description: 'kendaraan mengalami kerusakan dan tidak dapat melanjutkan perjalanan',
    waybillNumber: '100024000012',
    severity: 'CRITICAL',
    courierName: 'Teguh Wibowo',
    location: 'Jl. Panjang No. 14',
    timestamp: '2 mnt lalu',
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
  {
    id: 'INC-003',
    type: 'weather',
    title: 'Cuaca Buruk',
    description: 'hujan lebat menyebabkan jalan licin dan visibilitas rendah',
    waybillNumber: '100024000104',
    severity: 'WARNING',
    courierName: 'Indra Gunawan',
    location: 'Jl. Tebet Barat Dalam',
    timestamp: '5 mnt lalu',
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
];

import type { Courier } from '../features/monitoring/types';

const HUB_POS = { lat: -6.8249, lng: 106.8502 };

export const mockCouriers: Courier[] = [
  {
    id: 'STR-JKT-001',
    name: 'Budi Santoso',
    initials: 'BD',
    status: 'ONLINE',
    vehicle: 'Motor',
    position: { lat: -6.8268, lng: 106.8558 },
    hubPosition: HUB_POS,
    phone: '0812-1234-5678',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000000',
        serviceType: 'Same Day',
        weightKg: 1.4,
        recipientName: 'Ibu Ratna (Penerima)',
        recipientAddress: 'Jl. Gatot Subroto Kav. 22, Tebet, Jakarta Selatan',
        dropLat: -6.8195,
        dropLng: 106.8635,
        slaRemainingMinutes: 18,
        slaElapsedPct: 72,
      },
    ],
    route: {
      polyline: [
        { lat: -6.8249, lng: 106.8502 },
        { lat: -6.8255, lng: 106.8520 },
        { lat: -6.8261, lng: 106.8538 },
        { lat: -6.8268, lng: 106.8558 },
        { lat: -6.8255, lng: 106.8582 },
        { lat: -6.8235, lng: 106.8608 },
        { lat: -6.8210, lng: 106.8625 },
        { lat: -6.8195, lng: 106.8635 },
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
    position: { lat: -6.8312, lng: 106.8455 },
    hubPosition: HUB_POS,
    phone: '0813-9876-5432',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000009',
        serviceType: 'Frozen',
        weightKg: 2.1,
        recipientName: 'Pak Andi',
        recipientAddress: 'Jl. Gatot Subroto Kav. 22, Tebet, Jakarta Selatan',
        dropLat: -6.8178,
        dropLng: 106.8488,
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
        { lat: -6.8249, lng: 106.8502 },
        { lat: -6.8278, lng: 106.8480 },
        { lat: -6.8312, lng: 106.8455 },
        { lat: -6.8290, lng: 106.8470 },
        { lat: -6.8260, lng: 106.8482 },
        { lat: -6.8240, lng: 106.8490 },
        { lat: -6.8210, lng: 106.8488 },
        { lat: -6.8178, lng: 106.8488 },
      ],
      eta: '12 mnt',
    },
    lastKnownAddress: 'Jl. Gatot Subroto Kav. 22',
  },

  {
    id: 'STR-JKT-003',
    name: 'Rama Pratama',
    initials: 'RM',
    status: 'IDLE',
    vehicle: 'Motor',
    position: { lat: -6.8358, lng: 106.8520 },
    hubPosition: HUB_POS,
    phone: '0856-1122-3344',
    capacityTotal: 20,
    idleDuration: '12m',
    lastKnownAddress: 'Jl. Gatot Subroto No. 88',
    activePackages: [
      {
        waybillNumber: '100024000015',
        serviceType: 'Regular',
        weightKg: 0.8,
        recipientName: 'Bu Sari',
        recipientAddress: 'Jl. Tebet Raya No. 15',
        dropLat: -6.8290,
        dropLng: 106.8510,
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
    position: { lat: -6.8220, lng: 106.8488 },
    hubPosition: HUB_POS,
    phone: '0877-5544-3322',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000022',
        serviceType: 'Same Day',
        weightKg: 1.0,
        recipientName: 'Pak Bejo',
        recipientAddress: 'Jl. Tebet Barat No. 5',
        dropLat: -6.8200,
        dropLng: 106.8500,
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
    position: { lat: -6.8198, lng: 106.8545 },
    hubPosition: HUB_POS,
    phone: '0822-9988-7766',
    capacityTotal: 20,
    activePackages: [
      {
        waybillNumber: '100024000031',
        serviceType: 'Regular',
        weightKg: 1.5,
        recipientName: 'Pak Joko',
        recipientAddress: 'Jl. Tebet Timur No. 9',
        dropLat: -6.8175,
        dropLng: 106.8552,
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
        lat: -6.82 + (Math.sin(idx * 1.3) * 0.035),
        lng: 106.848 + (Math.cos(idx * 1.7) * 0.040),
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
          recipientAddress: `Jl. Tebet No. ${idx}`,
          dropLat: -6.820 + (Math.sin(idx) * 0.02),
          dropLng: 106.850 + (Math.cos(idx) * 0.02),
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
    lastKnownAddress: mockCouriers[1].lastKnownAddress ?? 'Jl. Gatot Subroto Kav. 22',
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

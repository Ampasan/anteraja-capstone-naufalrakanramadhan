import type {
  IncidentReport,
  CandidateCourier,
  ServiceType,
  SeverityLevel,
  IncidentStatusType,
} from '../features/incidents/types';

export const candidateCouriers: Record<string, CandidateCourier[]> = {
  'INC-TEB-082': [
    {
      id: 'CDD-FJR-001',
      name: 'Fajar Ramadhan',
      initials: 'FR',
      vehicleType: 'Van',
      vehiclePlate: 'B 1234 FAJ',
      distanceM: 800,
      etaMinutes: 4,
      remainingCapacityKg: 800,
      isRecommended: true,
      badge: 'Rekomendasi Utama',
    },
    {
      id: 'CDD-AFZ-002',
      name: 'Ahmad Fauzi',
      initials: 'AF',
      vehicleType: 'Truk Box',
      vehiclePlate: 'B 5678 AFZ',
      distanceM: 1400,
      etaMinutes: 7,
      remainingCapacityKg: 1500,
      isRecommended: false,
      badge: 'Alternatif 2',
    },
  ],
  'INC-TEB-083': [
    {
      id: 'CDD-BDI-003',
      name: 'Budi Santoso',
      initials: 'BS',
      vehicleType: 'Motor Chiller',
      vehiclePlate: 'B 9999 BDS',
      distanceM: 600,
      etaMinutes: 3,
      remainingCapacityKg: 50,
      isRecommended: true,
      badge: 'Rekomendasi Utama',
    },
  ],
  'INC-TEB-077': [
    {
      id: 'CDD-EKO-004',
      name: 'Eko Prasetyo',
      initials: 'EP',
      vehicleType: 'Pick Up Box',
      vehiclePlate: 'B 6719 HLM',
      distanceM: 450,
      etaMinutes: 2,
      remainingCapacityKg: 400,
      isRecommended: true,
      badge: 'Rekomendasi Utama',
    },
  ],
};

export const mockIncidents: IncidentReport[] = [
  {
    id: 'INC-TEB-082',
    severity: 'CRITICAL' as SeverityLevel,
    status: 'REVIEWING' as IncidentStatusType,
    waybillNumber: '100024000012',
    serviceType: 'Cargo' as ServiceType,
    serviceLabel: 'Cargo',

    courier: {
      id: 'CDD-TGH-010',
      name: 'Teguh Wibowo',
      vehicleType: 'Truk',
      vehiclePlate: 'CDD B 9281 KXT',
      phone: '0812-3456-7890',
    },

    kendala: 'Kopling Rusak / Mogok',
    stoppedLocation: 'Jl. Panjang No. 14',
    destination: 'Jl. Kebon Jeruk Raya',

    muatan: 'Cargo Truk',
    weightKg: 186.8,

    reportedAt: '2026-09-27T14:15:00',
    statusLabel: 'Klik untuk Evaluasi',
    evidenceImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
    evidencePublicId: 'foto_bukti/inc-hlm-082-kopling-rusak',
    evidenceCaption: 'Foto kabel kopling truk putus di Jl. Panjang',
    candidates: candidateCouriers['INC-TEB-082'],
  },
  {
    id: 'INC-TEB-083',
    severity: 'WARNING' as SeverityLevel,
    status: 'PENDING' as IncidentStatusType,
    waybillNumber: '100024000009',
    serviceType: 'Frozen' as ServiceType,
    serviceLabel: 'Frozen',

    courier: {
      id: 'STR-JKT-002',
      name: 'Rizky Pratama',
      vehicleType: 'Motor chiller box',
      vehiclePlate: 'B 4321 RPT',
      phone: '0813-9876-5432',
    },

    kendala: 'Pendingin Tidak Stabil',
    kendalaDetail: 'Suhu Anomali (6.2°C)',
    stoppedLocation: 'Jl. Gatot Subroto',
    destination: 'Tebet Barat V',

    muatan: 'Frozen',
    weightKg: 12.5,

    reportedAt: '2026-09-27T13:55:00',
    statusLabel: 'Klik untuk Evaluasi',
    candidates: candidateCouriers['INC-TEB-083'],
  },
  {
    id: 'INC-TEB-077',
    severity: 'CRITICAL' as SeverityLevel,
    status: 'PENDING' as IncidentStatusType,
    waybillNumber: '100024000104',
    serviceType: 'Next Day' as ServiceType,
    serviceLabel: 'Next Day',

    courier: {
      id: 'STR-JKT-007',
      name: 'Indra Gunawan',
      vehicleType: 'Blind Van',
      vehiclePlate: 'B 5512 HLM',
      phone: '0812-3456-7807',
    },

    kendala: 'Cuaca: Hujan Lebat & Macet',
    kendalaDetail: 'Banjir Jalur Alternatif',
    stoppedLocation: 'Jl. Tebet Barat Dalam',
    destination: 'Jl. Buaran Raya No. 45',

    muatan: 'Pakaian & Tekstil',
    weightKg: 6.0,

    reportedAt: '2026-09-27T13:30:00',
    statusLabel: 'Klik untuk Evaluasi',
    evidenceImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
    evidencePublicId: 'foto_bukti/inc-hlm-077-cuaca-hujan',
    evidenceCaption: 'Genangan banjir setinggi 40cm di jalan alternatif',
    candidates: candidateCouriers['INC-TEB-077'],
  },
];

export const incidentKpiSummary = {
  critical: 2,
  warning: 1,
  safePercent: 100,
};

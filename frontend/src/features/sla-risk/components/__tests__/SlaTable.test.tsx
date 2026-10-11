import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlaTable } from '../SlaTable';
import type { SlaOrder } from '../../types';

const ORDER: SlaOrder = {
  waybillNumber: 'INV-001',
  courierId: 'CR-01',
  serviceType: 'Frozen',
  weightKg: 2.5,
  slaDeadline: '2026-10-03T15:00:00+07:00',
  status: 'IN_TRANSIT',
  originLat: -6.265,
  originLng: 106.876,
  dropLat: -6.27,
  dropLng: 106.88,
  destinationName: 'Toko Sejahtera',
  destinationArea: 'Jakarta Utara',
  condition: { key: 'temp-box', label: 'Suhu Box' },
  slaRemainingMin: 45,
  slaRisk: 'Kritis',
  detail: {
    courierId: 'CR-01',
    vehicleType: 'Motorcycle',
    loadUsedKg: 3.5,
    loadCapacityKg: 20,
    loadKnown: true,
    destinationName: 'Toko Sejahtera',
    destinationAddress: 'Jakarta Utara',
    weightKg: 2.5,
    cargoClassification: 'Produk Beku / Cold Chain',
    timeline: [],
    hazard: {
      weather: 'Hujan deras',
      traffic: 'Padat',
      trafficColor: 'red',
      slaRiskScore: 7.5,
      slaRiskLabel: 'Tinggi',
      slaRiskColor: 'red',
    },
  },
};

const LATE_ORDER: SlaOrder = { ...ORDER, waybillNumber: 'INV-002', slaRemainingMin: -12 };

function renderTable(overrides: Partial<Parameters<typeof SlaTable>[0]> = {}) {
  const props = {
    orders: [ORDER],
    displayTotal: 1,
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    onPageChange: vi.fn(),
    onOpenDetail: vi.fn(),
    onOpenMap: vi.fn(),
    ...overrides,
  };
  render(<SlaTable {...props} />);
  return props;
}

describe('SlaTable', () => {
  it('menampilkan state memuat selagi data belum tiba', () => {
    renderTable({ orders: [], isLoading: true });

    expect(screen.getByText('Memuat daftar pengiriman…')).toBeInTheDocument();
    expect(screen.queryByText('Tidak ada pengiriman ditemukan')).not.toBeInTheDocument();
  });

  it('menampilkan state kosong setelah muat tanpa hasil', () => {
    renderTable({ orders: [] });

    expect(screen.getByText('Tidak ada pengiriman ditemukan')).toBeInTheDocument();
    expect(screen.queryByText('Memuat daftar pengiriman…')).not.toBeInTheDocument();
  });

  it('baris menampilkan resi dan sisa SLA dalam kalimat', () => {
    renderTable({ orders: [ORDER, LATE_ORDER], displayTotal: 2 });

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Sisa 45 mnt')).toBeInTheDocument();
    expect(screen.getByText('Terlambat 12 mnt')).toBeInTheDocument();
  });

  it('tombol Detail dan Peta meneruskan baris yang bersangkutan', async () => {
    const user = userEvent.setup();
    const props = renderTable();

    await user.click(within(screen.getAllByRole('row')[1]).getByRole('button', { name: 'Detail' }));
    expect(props.onOpenDetail).toHaveBeenCalledWith(ORDER);

    await user.click(within(screen.getAllByRole('row')[1]).getByRole('button', { name: 'Peta' }));
    expect(props.onOpenMap).toHaveBeenCalledWith(ORDER);
  });

  it('paginasi mengunci halaman 1 dan melaporkan pindah halaman', async () => {
    const user = userEvent.setup();
    const props = renderTable({ totalPages: 3 });

    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '2' }));

    expect(props.onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeEnabled();
  });
});

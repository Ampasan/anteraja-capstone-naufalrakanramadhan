import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CourierList } from '../CourierList';
import type { Courier } from '../../types';

const COURIER: Courier = {
  id: 'c1',
  name: 'Budi Santoso',
  initials: 'BS',
  status: 'IDLE',
  vehicle: 'Motorcycle',
  position: { lat: -6.266, lng: 106.877 },
  hubPosition: { lat: -6.2651893, lng: 106.8767953 },
  activePackages: [
    {
      waybillNumber: 'INV-001',
      serviceType: 'Frozen',
      weightKg: 2.5,
      recipientName: 'Siti',
      recipientAddress: 'Jl. Pulo Mas No. 1',
      dropLat: -6.27,
      dropLng: 106.88,
      slaRemainingMinutes: 45,
      slaElapsedPct: 60,
    },
  ],
  parcelCount: 2,
  capacityTotal: 6,
  idleDuration: '12 menit',
  lastKnownAddress: 'Jl. Pulo Mas Raya',
  phone: '081234567890',
};

function renderList(overrides: Partial<Parameters<typeof CourierList>[0]> = {}) {
  const props = {
    couriers: [COURIER],
    selectedCourier: null,
    activeFilter: 'all' as const,
    searchQuery: '',
    counts: { all: 1, online: 0, idle: 1 },
    onSelectCourier: vi.fn(),
    onFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    totalCount: 1,
    isLoading: false,
    isOpen: true,
    onToggle: vi.fn(),
    ...overrides,
  };
  render(<CourierList {...props} />);
  return props;
}

describe('CourierList', () => {
  it('menampilkan state memuat selagi data belum tiba', () => {
    renderList({ couriers: [], isLoading: true });

    expect(screen.getByText('Memuat daftar kurir…')).toBeInTheDocument();
    expect(screen.queryByText('Kurir tidak ditemukan')).not.toBeInTheDocument();
  });

  it('menampilkan state kosong ketika pencarian tak menemukan kurir', () => {
    renderList({ couriers: [] });

    expect(screen.getByText('Kurir tidak ditemukan')).toBeInTheDocument();
    expect(screen.queryByText('Memuat daftar kurir…')).not.toBeInTheDocument();
  });

  it('kartu kurir menampilkan nama dan meneruskan pilihan', async () => {
    const user = userEvent.setup();
    const props = renderList();

    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();

    await user.click(screen.getByText('Budi Santoso'));

    expect(props.onSelectCourier).toHaveBeenCalledWith(COURIER);
  });

  it('pencarian meneruskan kata kunci ke panel induk', () => {
    const props = renderList();

    // Value dikendalikan induk, jadi perubahan dikirim sebagai satu peristiwa.
    fireEvent.change(screen.getByPlaceholderText('Cari resi atau nama Satria...'), {
      target: { value: 'INV-001' },
    });

    expect(props.onSearchChange).toHaveBeenLastCalledWith('INV-001');
  });

  it('tab filter melaporkan filter yang dipilih', async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole('button', { name: 'Online (0)' }));

    expect(props.onFilterChange).toHaveBeenCalledWith('online');
  });

  it('footer merangkum jumlah kurir yang tampil', () => {
    renderList({ totalCount: 9 });

    expect(screen.getByText('Menampilkan 1 dari 9 Satria')).toBeInTheDocument();
  });

  it('tombol ciutkan daftar memanggil handler', async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByTitle('Sembunyikan daftar kurir'));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });
});

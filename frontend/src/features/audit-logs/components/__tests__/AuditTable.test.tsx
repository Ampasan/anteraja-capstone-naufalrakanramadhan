import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuditTable } from '../AuditTable';
import type { AuditLogEntry, PaginationState } from '../../types';

const ENTRY: AuditLogEntry = {
  id: 'log-1',
  logCode: 'AUD-HLM-2026-0104',
  resi: 'INV-001',
  serviceType: 'Frozen',
  completedAt: '2026-10-03T07:00:00Z',
  fromCourier: 'Budi Santoso',
  fromCourierCode: 'CR-01',
  toCourier: 'Rina Wijaya',
  toCourierCode: 'CR-02',
  incidentCategory: 'Anomali Suhu',
  incidentDetail: 'Suhu box naik',
  reportStatus: 'Selesai',
  handlingSeconds: 240,
  slaCompliant: true,
  executorName: 'Nina',
  evidenceImageUrl: '',
};

const PAGINATION: PaginationState = {
  page: 1,
  pageSize: 5,
  totalItems: 1,
  totalPages: 1,
};

function renderTable(overrides: Partial<Parameters<typeof AuditTable>[0]> = {}) {
  const props = {
    data: [ENTRY],
    pagination: PAGINATION,
    isLoading: false,
    onPageChange: vi.fn(),
    ...overrides,
  };
  render(<AuditTable {...props} />);
  return props;
}

describe('AuditTable', () => {
  it('menampilkan state memuat selagi riwayat belum tiba', () => {
    renderTable({ data: [], isLoading: true });

    expect(screen.getByText('Memuat riwayat…')).toBeInTheDocument();
    expect(screen.queryByText('Tidak ada catatan ditemukan')).not.toBeInTheDocument();
  });

  it('menampilkan state kosong ketika tak ada catatan', () => {
    renderTable({ data: [] });

    expect(screen.getByText('Tidak ada catatan ditemukan')).toBeInTheDocument();
    expect(screen.queryByText('Memuat riwayat…')).not.toBeInTheDocument();
  });

  it('baris memuat resi, status laporan, dan pengalihan kurir', () => {
    renderTable();

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Selesai')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Rina Wijaya')).toBeInTheDocument();
  });

  it('tombol salin resi tersedia per baris', () => {
    renderTable();

    expect(
      screen.getByRole('button', { name: 'Salin nomor resi INV-001' }),
    ).toBeInTheDocument();
  });

  it('paginasi melaporkan pindah halaman dan mengunci halaman pertama', async () => {
    const user = userEvent.setup();
    const props = renderTable({
      pagination: { page: 1, pageSize: 5, totalItems: 12, totalPages: 3 },
    });

    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Halaman 2' }));

    expect(props.onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('navigation', { name: 'Navigasi halaman' })).toBeInTheDocument();
  });
});

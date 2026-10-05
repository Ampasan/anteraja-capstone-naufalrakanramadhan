import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IncidentList } from '../IncidentList';
import type { IncidentReport } from '../../types';

const INCIDENT: IncidentReport = {
  id: 'inc-1',
  incidentCode: 'INC-HLM-082',
  severity: 'CRITICAL',
  status: 'REPORTED',
  waybillNumber: 'INV-001',
  serviceType: 'Frozen',
  serviceLabel: 'Frozen',
  courier: {
    id: 'c1',
    name: 'Budi Santoso',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'B 1111',
    phone: '081234567890',
  },
  kendala: 'Suhu box naik',
  kendalaDetail: 'Suhu 8 derajat',
  incidentCategory: 'Anomali Suhu',
  stoppedLocation: 'Jl. Pulo Mas',
  destination: 'Toko Sejahtera',
  muatan: 'Frozen',
  weightKg: 2.5,
  reportedAt: '2026-10-03T06:00:00Z',
  statusLabel: 'Dilaporkan',
  candidates: [],
};

function renderList(overrides: Partial<Parameters<typeof IncidentList>[0]> = {}) {
  const props = {
    incidents: [INCIDENT],
    totalCount: 1,
    selectedIncidentId: null,
    isLoading: false,
    onSelectIncident: vi.fn(),
    ...overrides,
  };
  render(<IncidentList {...props} />);
  return props;
}

describe('IncidentList', () => {
  it('menampilkan state memuat selagi insiden belum tiba', () => {
    renderList({ incidents: [], isLoading: true });

    expect(screen.getByText('Memuat daftar insiden…')).toBeInTheDocument();
    expect(screen.queryByText('Tidak ada insiden yang cocok')).not.toBeInTheDocument();
  });

  it('menampilkan state kosong ketika tak ada insiden yang cocok', () => {
    renderList({ incidents: [] });

    expect(screen.getByText('Tidak ada insiden yang cocok')).toBeInTheDocument();
    expect(screen.queryByText('Memuat daftar insiden…')).not.toBeInTheDocument();
  });

  it('kartu insiden menampilkan resi dan meneruskan pilihan saat diklik', async () => {
    const user = userEvent.setup();
    const props = renderList();

    expect(screen.getByText('Resi #INV-001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Resi #INV-001/ }));

    expect(props.onSelectIncident).toHaveBeenCalledWith('inc-1');
  });

  it('kartu insiden dapat diaktifkan dengan papan ketik', async () => {
    const user = userEvent.setup();
    const props = renderList();
    const card = screen.getByRole('button', { name: /Resi #INV-001/ });

    card.focus();
    await user.keyboard('{Enter}');

    expect(props.onSelectIncident).toHaveBeenCalledWith('inc-1');
  });

  it('footer merangkum jumlah insiden yang tampil', () => {
    renderList({ totalCount: 12 });

    const footer = screen.getByText(/Menampilkan/);
    expect(footer.textContent).toContain('dari');
    expect(footer.textContent).toContain('insiden');
  });

  it('menautkan nomor telepon kurir asli lewat skema tel', () => {
    renderList();

    const call = screen.getByRole('link', { name: /081234567890/ });

    expect(call).toHaveAttribute('href', 'tel:081234567890');
    expect(call).toHaveAttribute('title', 'Telepon Budi Santoso');
  });

  it('klik nomor telepon tidak ikut memilih insiden', async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole('link', { name: /081234567890/ }));

    expect(props.onSelectIncident).not.toHaveBeenCalled();
  });

  it('menyembunyikan baris telepon ketika nomor kurir kosong', () => {
    renderList({
      incidents: [{ ...INCIDENT, courier: { ...INCIDENT.courier, phone: '' } }],
    });

    expect(screen.queryByRole('link', { name: /081234567890/ })).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReassignPanel } from '../ReassignPanel';
import type { CandidateCourier, IncidentReport } from '../../types';

const CANDIDATE: CandidateCourier = {
  id: 'c2',
  name: 'Eko Prasetyo',
  initials: 'EP',
  vehicleType: 'Motorcycle',
  vehiclePlate: 'B 2222',
  distanceM: 900,
  etaMinutes: 4,
  remainingCapacityKg: 16,
  isRecommended: true,
  badge: 'Terdekat',
  currentParcels: 3,
  maxParcels: 12,
};

const INCIDENT: IncidentReport = {
  id: 'inc-1',
  incidentCode: 'INC-HLM-086',
  severity: 'WARNING',
  status: 'ESCALATED',
  waybillNumber: 'INV-001',
  serviceType: 'Instant',
  serviceLabel: 'Instant',
  courier: {
    id: 'c1',
    name: 'Indra Gunawan',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'B 1111',
    phone: '087723305893',
  },
  kendala: 'Cuaca / Hujan',
  stoppedLocation: 'Jl. Mayjen Sutoyo',
  destination: 'Toko Sejahtera',
  muatan: 'Instant',
  weightKg: 2,
  reportedAt: '2026-10-03T06:00:00Z',
  statusLabel: 'Klik untuk Evaluasi',
  candidates: [CANDIDATE],
};

function renderPanel(overrides: Partial<Parameters<typeof ReassignPanel>[0]> = {}) {
  const props = {
    incident: INCIDENT,
    selectedCandidateId: null,
    onSelectCandidate: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  const view = render(<ReassignPanel {...props} />);
  return { ...view, props };
}

describe('ReassignPanel', () => {
  it('panel kosong ketika belum ada insiden terpilih', () => {
    renderPanel({ incident: null });

    expect(screen.getByText(/Pilih insiden/i)).toBeInTheDocument();
  });

  it('konfirmasi pengalihan tetap terkunci sampai kandidat dipilih', async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderPanel();

    expect(screen.getByRole('button', { name: /Konfirmasi Pengalihan/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Eko Prasetyo/ }));

    // Panel terkendali: kandidat dipilih hanya lewat callback, tombol baru
    // terbuka setelah induknya menyetorkan id itu kembali.
    expect(props.onSelectCandidate).toHaveBeenCalledWith('c2');
    expect(screen.getByRole('button', { name: /Konfirmasi Pengalihan/ })).toBeDisabled();

    rerender(<ReassignPanel {...props} selectedCandidateId="c2" />);

    expect(screen.getByRole('button', { name: /Konfirmasi Pengalihan/ })).toBeEnabled();
  });
});

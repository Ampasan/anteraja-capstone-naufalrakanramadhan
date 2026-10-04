import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HubSelect } from '../HubSelect';
import type { Hub } from '../../../monitoring/types';

const HUBS: Hub[] = [
  {
    id: 'hub-1',
    name: 'Hub Halim - Jakarta Timur',
    shortName: 'HUB HALIM',
    position: { lat: -6.265, lng: 106.876 },
    radiusKm: 5,
    capacityUsed: 40,
    capacityTotal: 100,
  },
  {
    id: 'hub-2',
    name: 'Hub Cakung - Jakarta Timur',
    shortName: 'HUB CAKUNG',
    position: { lat: -6.3, lng: 106.9 },
    radiusKm: 6,
    capacityUsed: 10,
    capacityTotal: 80,
  },
];

describe('HubSelect', () => {
  it('merender seluruh hub sebagai pilihan', () => {
    render(<HubSelect value="" onChange={vi.fn()} hubs={HUBS} />);

    expect(screen.getByRole('option', { name: 'Hub Halim - Jakarta Timur' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hub Cakung - Jakarta Timur' })).toBeInTheDocument();
  });

  it('melaporkan hub yang dipilih', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<HubSelect value="hub-1" onChange={onChange} hubs={HUBS} />);
    await user.selectOptions(screen.getByLabelText('Pilih stasiun layanan'), 'hub-2');

    expect(onChange).toHaveBeenCalledWith('hub-2');
  });

  it('daftar kosong menampilkan keterangan, bukan select sunyi', () => {
    render(<HubSelect value="" onChange={vi.fn()} hubs={[]} />);

    expect(screen.getByRole('option', { name: 'Hub tidak tersedia' })).toBeInTheDocument();
  });

  it('terkunci selagi daftar masih dimuat', () => {
    render(<HubSelect value="" onChange={vi.fn()} hubs={[]} isLoading />);

    expect(screen.getByLabelText('Pilih stasiun layanan')).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Memuat daftar hub…' })).toBeInTheDocument();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_DELAY_MS, useIncidentToast } from '../useIncidentToast';
import type { IncidentReport } from '../../features/incidents/types';

function incident(overrides: Partial<IncidentReport>): IncidentReport {
  return {
    id: 'inc-1',
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
    ...overrides,
  };
}

const reported = incident({});
const second = incident({ id: 'inc-2', waybillNumber: 'INV-002', status: 'REPORTED' });
const resolved = incident({ id: 'inc-3', status: 'RESOLVED' });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIncidentToast', () => {
  it('muncul tepat setelah jeda 5 detik sejak dipasang', () => {
    const { result } = renderHook(() => useIncidentToast([reported]));

    expect(result.current.visible).toBe(false);

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS - 1));
    expect(result.current.visible).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.visible).toBe(true);
    expect(result.current.incident?.id).toBe('inc-1');
    expect(result.current.alert?.icon).toBe('snowflake');
  });

  it('mengunci insiden pertama yang masih aktif, melewati yang RESOLVED', () => {
    const { result } = renderHook(() => useIncidentToast([resolved, reported, second]));

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));

    expect(result.current.incident?.id).toBe('inc-1');
  });

  it('tidak pernah muncul bila hanya ada insiden RESOLVED', () => {
    const { result } = renderHook(() => useIncidentToast([resolved]));

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS * 3));

    expect(result.current.visible).toBe(false);
    expect(result.current.incident).toBeNull();
  });

  it('menunggu insiden berikutnya bila saat jeda belum ada yang aktif', () => {
    const { result, rerender } = renderHook(({ list }) => useIncidentToast(list), {
      initialProps: { list: [] as IncidentReport[] },
    });

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));
    expect(result.current.visible).toBe(false);

    rerender({ list: [reported] });
    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));

    expect(result.current.visible).toBe(true);
    expect(result.current.incident?.id).toBe('inc-1');
  });

  it('id yang dikunci tidak berubah walau daftar insiden berubah', () => {
    const { result, rerender } = renderHook(({ list }) => useIncidentToast(list), {
      initialProps: { list: [reported, second] },
    });

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));
    rerender({ list: [second, reported] });

    expect(result.current.incident?.id).toBe('inc-1');

    rerender({ list: [reported] });
    expect(result.current.visible).toBe(true);
    expect(result.current.incident?.id).toBe('inc-1');
  });

  it('toast hilang saat insiden yang dikunci sudah RESOLVED', () => {
    const { result, rerender } = renderHook(({ list }) => useIncidentToast(list), {
      initialProps: { list: [reported] },
    });

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));
    rerender({ list: [{ ...reported, status: 'RESOLVED' as const }] });

    expect(result.current.visible).toBe(false);
    expect(result.current.incident).toBeNull();
  });

  it('dismiss menutup toast dan tidak muncul kembali pada sesi yang sama', () => {
    const { result } = renderHook(() => useIncidentToast([reported]));

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS));
    expect(result.current.visible).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.visible).toBe(false);

    act(() => vi.advanceTimersByTime(TOAST_DELAY_MS * 3));
    expect(result.current.visible).toBe(false);
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuditLogs } from '../useAuditLogs';
import { apiCached, invalidateApiCache } from '../../../../lib/api';
import { operationalNow, operationalNowMs } from '../../../../lib/operationalClock';
import type { RawAuditLog } from '../../../../lib/mappers';

vi.mock('../../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/api')>();
  return { ...actual, apiCached: vi.fn(), invalidateApiCache: vi.fn() };
});

const apiCachedMock = vi.mocked(apiCached);
const invalidateMock = vi.mocked(invalidateApiCache);

const NOW = operationalNow();

function log(overrides: Partial<RawAuditLog>): RawAuditLog {
  return {
    id: 'log-1',
    resi: 'INV-001',
    service_type: 'Regular',
    completed_at: operationalNow().toISOString(),
    from_courier: 'Budi Santoso',
    to_courier: 'Rina Wijaya',
    incident_category: 'Ban Bocor',
    incident_detail: 'Ban kempes',
    report_status: 'Dialihkan',
    handling_seconds: 120,
    sla_compliant: true,
    ...overrides,
  };
}

const minutesAgo = (minutes: number) =>
  new Date(operationalNowMs() - minutes * 60_000).toISOString();

const defaultLogs: RawAuditLog[] = [
  log({ id: 'a', resi: 'INV-AAA', completed_at: minutesAgo(60), incident_category: 'Cuaca / Hujan' }),
  log({ id: 'b', resi: 'INV-BBB', completed_at: minutesAgo(50), incident_category: 'Cuaca / Hujan' }),
  log({ id: 'c', resi: 'INV-CCC', completed_at: minutesAgo(40) }),
  log({ id: 'd', resi: 'INV-DDD', completed_at: minutesAgo(30), incident_category: 'Anomali Suhu' }),
  log({ id: 'e', resi: 'INV-EEE', completed_at: minutesAgo(20) }),
  log({ id: 'f', resi: 'INV-FFF', completed_at: minutesAgo(10), incident_category: 'Mogok Kendaraan' }),
  log({ id: 'g', resi: 'INV-GGG', completed_at: minutesAgo(5), incident_category: 'Banjir' }),
];

async function renderLoaded(logs: RawAuditLog[]) {
  apiCachedMock.mockResolvedValue({ logs });
  const view = renderHook(() => useAuditLogs());
  await act(async () => {});
  return view;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useAuditLogs: pengurutan', () => {
  it('riwayat selalu terbaru di atas walau urutan server berantakan', async () => {
    const { result } = await renderLoaded([
      log({ id: 'tua', completed_at: minutesAgo(120) }),
      log({ id: 'baru', completed_at: minutesAgo(5) }),
      log({ id: 'tengah', completed_at: minutesAgo(60) }),
    ]);

    expect(result.current.filteredAll.map((entry) => entry.id)).toEqual([
      'baru',
      'tengah',
      'tua',
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it('payload kosong menghasilkan paginasi satu halaman kosong', async () => {
    const { result } = await renderLoaded([]);

    expect(result.current.filteredAll).toEqual([]);
    expect(result.current.pagedData).toEqual([]);
    expect(result.current.pagination).toMatchObject({ page: 1, totalItems: 0, totalPages: 1 });
    expect(result.current.kpi).toMatchObject({ totalCompleted: 0, slaComplianceRate: 0 });
    expect(result.current.errorMessage).toBeNull();
  });
});

describe('useAuditLogs: filter tanggal', () => {
  const startOfToday = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const cutoff7Days = new Date(operationalNowMs() - 7 * 24 * 60 * 60 * 1000);

  it('today memasukkan titik awal hari secara persis dan menolak 1 ms sebelumnya', async () => {
    apiCachedMock.mockResolvedValue({
      logs: [
        log({ id: 'pas', resi: 'INV-PAS', completed_at: startOfToday.toISOString() }),
        log({
          id: 'kurang',
          resi: 'INV-KURANG',
          completed_at: new Date(startOfToday.getTime() - 1).toISOString(),
        }),
      ],
    });
    const view = renderHook(() => useAuditLogs());
    await act(async () => {});

    act(() => view.result.current.setDateFilter('today'));

    expect(view.result.current.filteredAll.map((entry) => entry.resi)).toEqual(['INV-PAS']);
  });

  it('7days memasukkan tepat pada batas 7 hari dan menolak 1 ms lebih tua', async () => {
    apiCachedMock.mockResolvedValue({
      logs: [
        log({ id: 'pas', resi: 'INV-PAS', completed_at: cutoff7Days.toISOString() }),
        log({
          id: 'kurang',
          resi: 'INV-KURANG',
          completed_at: new Date(cutoff7Days.getTime() - 1).toISOString(),
        }),
      ],
    });
    const view = renderHook(() => useAuditLogs());
    await act(async () => {});

    act(() => view.result.current.setDateFilter('7days'));

    expect(view.result.current.filteredAll.map((entry) => entry.resi)).toEqual(['INV-PAS']);
  });

  it('month memilih bulan jam operasional, bukan bulan kalender hari ini', async () => {
    const firstOfMonth = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
    const lastOfPrevMonth = new Date(NOW.getFullYear(), NOW.getMonth(), 0);
    apiCachedMock.mockResolvedValue({
      logs: [
        log({ id: 'awal', resi: 'INV-AWAL', completed_at: firstOfMonth.toISOString() }),
        log({
          id: 'lalu',
          resi: 'INV-LALU',
          completed_at: lastOfPrevMonth.toISOString(),
        }),
      ],
    });
    const view = renderHook(() => useAuditLogs());
    await act(async () => {});

    act(() => view.result.current.setDateFilter('month'));

    expect(view.result.current.filteredAll.map((entry) => entry.resi)).toEqual(['INV-AWAL']);
  });

  it('filter "all" meneruskan seluruh baris', async () => {
    const { result } = await renderLoaded(defaultLogs);

    act(() => result.current.setDateFilter('all'));

    expect(result.current.filteredAll).toHaveLength(7);
  });
});

describe('useAuditLogs: pencarian dan kategori', () => {
  it('pencarian memakai resi dan nama kurir tanpa peduli huruf besar/kecil', async () => {
    const { result } = await renderLoaded(defaultLogs);

    act(() => result.current.setSearch('INV-GGG'));
    expect(result.current.filteredAll.map((entry) => entry.id)).toEqual(['g']);

    act(() => result.current.setSearch('rInA'));
    expect(result.current.filteredAll).toHaveLength(7);
  });

  it('filter kategori menyaring baris tanpa mengubah hitungan kategori', async () => {
    const { result } = await renderLoaded(defaultLogs);

    act(() => result.current.setCategoryFilter('Ban Bocor'));

    expect(result.current.filteredAll).toHaveLength(2);
    expect(result.current.pagination.totalItems).toBe(2);
    expect(result.current.categoryCounts.find((c) => c.key === 'all')?.count).toBe(7);
    expect(result.current.categoryCounts.find((c) => c.key === 'Cuaca / Hujan')?.count).toBe(2);
    expect(result.current.categoryCounts.find((c) => c.key === 'Banjir')?.count).toBe(1);
  });

  it('resetFilters mengembalikan semua filter ke keadaan awal', async () => {
    const { result } = await renderLoaded(defaultLogs);

    act(() => result.current.setSearch('INV-AAA'));
    act(() => result.current.setCategoryFilter('Banjir'));
    act(() => result.current.setDateFilter('today'));
    act(() => result.current.resetFilters());

    expect(result.current.filters).toEqual({
      search: '',
      dateFilter: 'all',
      categoryFilter: 'all',
    });
    expect(result.current.filteredAll).toHaveLength(7);
  });
});

describe('useAuditLogs: paginasi', () => {
  it('membagi lima baris per halaman dan mengunci halaman dalam rentang', async () => {
    const { result } = await renderLoaded(defaultLogs);

    expect(result.current.pagination).toMatchObject({ page: 1, pageSize: 5, totalPages: 2 });
    expect(result.current.pagedData).toHaveLength(5);

    act(() => result.current.goToPage(2));
    expect(result.current.pagedData).toHaveLength(2);
    expect(result.current.pagedData[0].id).toBe('b');

    act(() => result.current.goToPage(99));
    expect(result.current.pagination.page).toBe(2);
  });

  it('mengubah halaman kembali ke halaman pertama saat pencarian diubah', async () => {
    const { result } = await renderLoaded(defaultLogs);

    act(() => result.current.goToPage(2));
    act(() => result.current.setSearch('INV-GGG'));

    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagedData).toHaveLength(1);
  });
});

describe('useAuditLogs: muat ulang dan galat', () => {
  it('refresh membuang cache prefix /audit-logs lalu memuat ulang', async () => {
    apiCachedMock.mockResolvedValue({ logs: defaultLogs });
    const view = renderHook(() => useAuditLogs());
    await act(async () => {});
    expect(apiCachedMock).toHaveBeenCalledTimes(1);

    await act(async () => { await view.result.current.refresh(); });

    expect(invalidateMock).toHaveBeenCalledWith('/audit-logs');
    expect(apiCachedMock).toHaveBeenCalledTimes(2);
  });

  it('galat server tampil sebagai pesan, bukan membiarkan layar memuat terus', async () => {
    apiCachedMock.mockRejectedValue(new Error('Server tidak dapat memproses permintaan.'));
    const view = renderHook(() => useAuditLogs());
    await act(async () => {});

    expect(view.result.current.errorMessage).toBe('Server tidak dapat memproses permintaan.');
    expect(view.result.current.isLoading).toBe(false);
  });
});

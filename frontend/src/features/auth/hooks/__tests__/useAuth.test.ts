import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../useAuth';
import { api, apiCached, ApiError } from '../../../../lib/api';
import { getToken } from '../../../../lib/session';
import type { SessionUser } from '../../../../lib/session';
import type { RawHub } from '../../../../lib/mappers';

vi.mock('../../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/api')>();
  return { ...actual, api: vi.fn(), apiCached: vi.fn() };
});

const apiMock = vi.mocked(api);
const apiCachedMock = vi.mocked(apiCached);

const user: SessionUser = {
  id: 'u1',
  name: 'Nina',
  email: 'nina@anteraja.id',
  hub_id: 'hub-1',
  hub_name: 'Hub Halim',
};

const HUB: RawHub = {
  id: 'hub-1',
  name: 'Hub Halim - Jakarta Timur',
  short_name: 'HUB HALIM',
  city: 'Jakarta Timur',
  position: { lat: -6.265, lng: 106.876 },
  radius_km: 5,
  capacity_used: 40,
  capacity_total: 100,
};

async function renderWithHubs() {
  const view = renderHook(() => useAuth());
  // Melewatkan promise apiCached agar daftar hub terpasang sebelum assert.
  await act(async () => {});
  return view;
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  apiCachedMock.mockResolvedValue({ hubs: [HUB] });
});

describe('useAuth: keadaan dasar', () => {
  it('memilih hub pertama secara otomatis begitu daftar siap', async () => {
    const { result } = await renderWithHubs();

    expect(result.current.formState.hubId).toBe('hub-1');
    expect(result.current.isPreparing).toBe(false);
    expect(result.current.hubs).toHaveLength(1);
  });

  it('menyembunyikan dan menampilkan kembali kata sandi', async () => {
    const { result } = await renderWithHubs();

    expect(result.current.formState.showPassword).toBe(false);
    act(() => result.current.toggleShowPassword());
    expect(result.current.formState.showPassword).toBe(true);
  });
});

describe('useAuth: validasi', () => {
  it('hub kosong menahan submit sebelum request dikirim', async () => {
    apiCachedMock.mockResolvedValue({ hubs: [] });
    const { result } = await renderWithHubs();
    const onSuccess = vi.fn();

    act(() => result.current.handleSubmit(onSuccess));

    expect(result.current.formState.errorMessage).toBe(
      'Pilih stasiun layanan terlebih dahulu.',
    );
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('email atau kata sandi kosong menahan submit', async () => {
    const { result } = await renderWithHubs();
    const onSuccess = vi.fn();

    act(() => result.current.handleEmailChange('   '));
    act(() => result.current.handleSubmit(onSuccess));

    expect(result.current.formState.errorMessage).toBe('Email dan kata sandi wajib diisi.');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('setiap perubahan field menghapus pesan error sebelumnya', async () => {
    const { result } = await renderWithHubs();

    act(() => result.current.handleSubmit(vi.fn()));
    expect(result.current.formState.errorMessage).not.toBeNull();

    act(() => result.current.handleHubChange('hub-2'));
    expect(result.current.formState.errorMessage).toBeNull();
    expect(result.current.formState.hubId).toBe('hub-2');
  });
});

describe('useAuth: respons gagal', () => {
  const cases: Array<[unknown, string]> = [
    [new ApiError('Unauthenticated.', 401), 'Email atau kata sandi salah.'],
    [new ApiError('CSRF token mismatch.', 419), 'Sesi halaman kedaluwarsa. Muat ulang halaman.'],
    [
      new ApiError('Too many attempts.', 429),
      'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    ],
    [new ApiError('DB down.', 503), 'Server sedang bermasalah. Coba beberapa saat lagi.'],
    [new ApiError('Email tidak terdaftar.', 422), 'Email tidak terdaftar.'],
    [new TypeError('Failed to fetch'), 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'],
    [new Error('aneh'), 'Terjadi kesalahan yang tidak terduga. Coba lagi.'],
  ];

  it.each(cases)('error %s dipetakan ke pesan ramah', async (error, expected) => {
    const { result } = await renderWithHubs();
    apiMock.mockRejectedValue(error);
    act(() => {
      result.current.handleEmailChange('nina@anteraja.id');
      result.current.handlePasswordChange('rahasia');
    });

    await act(async () => { result.current.handleSubmit(vi.fn()); });

    expect(result.current.formState.errorMessage).toBe(expected);
    expect(result.current.formState.isLoading).toBe(false);
  });
});

describe('useAuth: submit', () => {
  it('sukses menyimpan sesi dan memanggil callback sekali', async () => {
    const { result } = await renderWithHubs();
    const onSuccess = vi.fn();
    apiMock.mockResolvedValue({ token: 'tok-ok', user });
    act(() => {
      result.current.handleEmailChange('nina@anteraja.id');
      result.current.handlePasswordChange('rahasia');
    });

    await act(async () => { result.current.handleSubmit(onSuccess); });

    expect(getToken()).toBe('tok-ok');
    expect(result.current.formState.isLoading).toBe(false);
    expect(result.current.formState.errorMessage).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('kunci anti klik-ganda: submit kedua diabaikan sampai request tuntas', async () => {
    const { result } = await renderWithHubs();
    const onSuccess = vi.fn();
    let resolveLogin!: (value: { token: string; user: SessionUser }) => void;
    apiMock.mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; }),
    );
    act(() => {
      result.current.handleEmailChange('nina@anteraja.id');
      result.current.handlePasswordChange('rahasia');
    });

    act(() => {
      result.current.handleSubmit(onSuccess);
      result.current.handleSubmit(onSuccess);
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(result.current.formState.isLoading).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();

    await act(async () => { resolveLogin({ token: 'tok-ok', user }); });

    expect(result.current.formState.isLoading).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    act(() => result.current.handleSubmit(onSuccess));
    expect(apiMock).toHaveBeenCalledTimes(2);
  });
});

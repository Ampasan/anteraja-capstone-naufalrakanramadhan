import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  ApiError,
  UNAUTHORIZED_EVENT,
  api,
  apiCached,
  apiVoid,
  apiWithStatus,
  invalidateApiCache,
  waitForTask,
} from '../api';
import { getToken, setSession, type SessionUser } from '../session';

const fetchMock = vi.fn();

const user: SessionUser = {
  id: 'u1',
  name: 'Nina',
  email: 'nina@anteraja.id',
  hub_id: 'hub-1',
  hub_name: 'Hub Halim',
};

function envelope(data: unknown, ok = true): Response {
  return new Response(JSON.stringify({ ok, data, message: ok ? null : 'Gagal' }), { status: 200 });
}

function jsonError(status: number, message?: string): Response {
  const body = message === undefined ? 'bukan-json' : JSON.stringify({ message });
  return new Response(body, { status });
}

function lastHeaders(): Headers {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
  return new Headers(init.headers);
}

describe('api', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    invalidateApiCache();
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mengembalikan data dari envelope sukses', async () => {
    fetchMock.mockResolvedValue(envelope({ id: 'ORD-1' }));

    await expect(api<{ id: string }>('/orders')).resolves.toEqual({ id: 'ORD-1' });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/orders`, expect.anything());
    expect(lastHeaders().get('Accept')).toBe('application/json');
  });

  it('menyisipkan Bearer token dari sesi aktif', async () => {
    setSession('tok-123', user, true);
    fetchMock.mockResolvedValue(envelope(null));

    await api('/me');

    expect(lastHeaders().get('Authorization')).toBe('Bearer tok-123');
    expect(getToken()).toBe('tok-123');
  });

  it('melempar ApiError berisi pesan server ketika envelope berok=false', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, data: null, message: 'Stasiun tidak valid' }), {
        status: 200,
      }),
    );

    const error = await api('/orders').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'ApiError', message: 'Stasiun tidak valid', status: 200 });
  });

  it('melempar ApiError bernomor status dari respons error', async () => {
    fetchMock.mockResolvedValue(jsonError(422, 'Validasi gagal'));

    await expect(api('/orders')).rejects.toMatchObject({
      message: 'Validasi gagal',
      status: 422,
    });
  });

  it('memakai pesan cadangan yang layak tampil saat body bukan JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonError(404));
    await expect(api('/missing')).rejects.toMatchObject({ message: 'Data tidak ditemukan.' });

    fetchMock.mockResolvedValueOnce(jsonError(500));
    await expect(api('/boom')).rejects.toMatchObject({
      message: 'Terjadi gangguan pada server. Coba lagi.',
    });

    fetchMock.mockResolvedValueOnce(jsonError(429));
    await expect(api('/spam')).rejects.toMatchObject({
      message: 'Terlalu banyak permintaan. Tunggu sebentar.',
    });

    fetchMock.mockResolvedValueOnce(jsonError(403));
    await expect(api('/forbidden')).rejects.toMatchObject({
      message: 'Server tidak dapat memproses permintaan.',
    });
  });

  it('ApiError tetap terbaca sebagai Error', () => {
    const error = new ApiError('Gagal', 500);

    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeDefined();
    expect(String(error)).toContain('Gagal');
  });
});

describe('api: respons 401', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('memancarkan UNAUTHORIZED_EVENT dan menghapus sesi', async () => {
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    setSession('kedaluwarsa', user, true);
    fetchMock.mockResolvedValue(jsonError(401, 'Unauthenticated.'));

    await expect(api('/me')).rejects.toMatchObject({ status: 401, message: 'Unauthenticated.' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});

describe('apiWithStatus', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('menandai 202 sebagai accepted', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { queued: true }, message: null }), {
        status: 202,
      }),
    );

    await expect(apiWithStatus('/reassign')).resolves.toEqual({
      status: 'accepted',
      http: 202,
      data: { queued: true },
    });
  });

  it('menandai 200 sebagai success', async () => {
    fetchMock.mockResolvedValue(envelope({ done: true }));

    await expect(apiWithStatus('/reassign')).resolves.toMatchObject({ status: 'success', http: 200 });
  });

  it('melempar ApiError untuk respons gagal', async () => {
    fetchMock.mockResolvedValue(jsonError(500, 'Server error'));

    await expect(apiWithStatus('/reassign')).rejects.toMatchObject({ status: 500 });
  });
});

describe('apiVoid', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('selesai tanpa membaca body bila respons sukses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      apiVoid('/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
    ).resolves.toBeUndefined();
    expect(lastHeaders().get('Content-Type')).toBe('application/json');
  });

  it('melempar ApiError bila respons gagal', async () => {
    fetchMock.mockResolvedValue(jsonError(401, 'Unauthenticated.'));

    await expect(apiVoid('/auth/logout')).rejects.toMatchObject({ status: 401 });
  });
});

describe('apiCached', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    invalidateApiCache();
    sessionStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('melayani dari cache selama TTL lalu menembus server setelah kedaluwarsa', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    // Respons baru tiap panggilan: body Response hanya bisa dibaca sekali.
    fetchMock.mockImplementation(async () => envelope({ total: 7 }));

    await expect(apiCached<{ total: number }>('/dashboard/summary', 5_000)).resolves.toEqual({
      total: 7,
    });

    now.mockReturnValue(3_000);
    await apiCached('/dashboard/summary', 5_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now.mockReturnValue(8_000);
    await apiCached('/dashboard/summary', 5_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('menyatukan panggilan paralel yang identik menjadi satu request', async () => {
    let settle!: (response: Response) => void;
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolve) => { settle = resolve; }),
    );

    const first = apiCached('/couriers', 60_000);
    const second = apiCached('/couriers', 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    settle(envelope({ list: [1, 2] }));
    await expect(first).resolves.toEqual({ list: [1, 2] });
    await expect(second).resolves.toEqual({ list: [1, 2] });
  });

  it('invalidateApiCache hanya membuang entri dengan awalan yang cocok', async () => {
    fetchMock.mockImplementation(async () => envelope('x'));
    await apiCached('/audit-logs?page=1', 60_000);
    await apiCached('/hubs', 60_000);

    invalidateApiCache('/audit-logs');

    await apiCached('/audit-logs?page=1', 60_000);
    await apiCached('/hubs', 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('daftar awalan kosong tidak membuang cache apa pun', async () => {
    fetchMock.mockImplementation(async () => envelope('x'));
    await apiCached('/hubs', 60_000);

    invalidateApiCache([]);

    await apiCached('/hubs', 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tanpa argumen menyapu seluruh cache', async () => {
    fetchMock.mockImplementation(async () => envelope('x'));
    await apiCached('/hubs', 60_000);
    await apiCached('/couriers', 60_000);

    invalidateApiCache();

    await apiCached('/hubs', 60_000);
    await apiCached('/couriers', 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('membuang entri tertua setelah pagu 100 tercapai', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    fetchMock.mockImplementation(async () => envelope('x'));

    for (let i = 0; i < 100; i++) await apiCached(`/q/${i}`, 1_000_000_000);

    now.mockReturnValue(1_000);
    await apiCached('/q/100', 1_000_000_000);

    // Entri pertama tersingkir, jadi walau TTL-nya masih jauh ia ikut diambil ulang.
    await apiCached('/q/0', 1_000_000_000);
    expect(fetchMock).toHaveBeenCalledTimes(102);
  });

  it('memori yang kedaluwarsa tetap menunggu data segar, bukan isi lama', async () => {
    fetchMock.mockImplementation(async () => envelope({ total: 1 }));
    await apiCached('/couriers', 0, { staleMs: 60_000 });

    fetchMock.mockImplementation(async () => envelope({ total: 2 }));

    await expect(apiCached<{ total: number }>('/couriers', 0, { staleMs: 60_000 })).resolves.toEqual({
      total: 2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('memori kosong saat reload: isi tahan-simpan tampil lebih dulu lalu ditimpa di latar belakang', async () => {
    fetchMock.mockImplementation(async () => envelope({ total: 1 }));
    await apiCached('/couriers', 60_000, { staleMs: 60_000 });

    // Simulasikan reload: modul baru sehingga memori kosong, sessionStorage tetap.
    vi.resetModules();
    fetchMock.mockImplementation(async () => envelope({ total: 2 }));
    const reloaded = await import('../api');

    await expect(
      reloaded.apiCached<{ total: number }>('/couriers', 60_000, { staleMs: 60_000 }),
    ).resolves.toEqual({ total: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.waitFor(() => {
      const persisted = JSON.parse(sessionStorage.getItem('anteraja.api.cache') ?? '{}');
      expect(persisted['/couriers']?.data).toEqual({ total: 2 });
    });

    await expect(
      reloaded.apiCached<{ total: number }>('/couriers', 60_000, { staleMs: 60_000 }),
    ).resolves.toEqual({ total: 2 });
  });

  it('invalidateApiCache ikut membuang cadangan tahan-simpan', async () => {
    fetchMock.mockImplementation(async () => envelope({ total: 1 }));
    await apiCached('/couriers', 60_000, { staleMs: 60_000 });

    invalidateApiCache('/couriers');

    expect(sessionStorage.getItem('anteraja.api.cache')).toBe('{}');
  });

  it('mendorong hasil revalidasi latar ke onRevalidated', async () => {
    fetchMock.mockImplementation(async () => envelope({ total: 1 }));
    await apiCached('/couriers', 60_000, { staleMs: 60_000 });

    // Simulasikan reload: memori kosong, sessionStorage tetap.
    vi.resetModules();
    let settle!: (response: Response) => void;
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolve) => { settle = resolve; }),
    );
    const reloaded = await import('../api');

    const onRevalidated = vi.fn();
    await expect(
      reloaded.apiCached<{ total: number }>('/couriers', 0, {
        staleMs: 60_000,
        onRevalidated,
      }),
    ).resolves.toEqual({ total: 1 });
    expect(onRevalidated).not.toHaveBeenCalled();

    settle(envelope({ total: 2 }));
    await vi.waitFor(() => expect(onRevalidated).toHaveBeenCalledWith({ total: 2 }));
  });

  it('menulis cadangan tahan-simpan paling sekali per jeda throttle', async () => {
    fetchMock.mockImplementation(async () => envelope({ total: 1 }));
    await apiCached('/couriers', 0, { staleMs: 60_000 });

    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await apiCached('/couriers', 0, { staleMs: 60_000 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('waitForTask', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const task = (status: string) => ({
    id: 'task-1',
    type: 'export',
    status,
    message: 'ok',
    updated_at: '2026-10-03T07:00:00Z',
  });

  it('berhenti pada status terminal dan melaporkan setiap pembaruan', async () => {
    fetchMock.mockResolvedValue(envelope(task('completed')));
    const onUpdate = vi.fn();

    await expect(waitForTask('task-1', { onUpdate })).resolves.toMatchObject({
      status: 'completed',
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('menghentikan pantauan dan mengembalikan null saat request gagal', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(waitForTask('hilang')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSession,
  getLoginAt,
  getToken,
  getUser,
  hasSession,
  isRemembered,
  setSession,
  type SessionUser,
} from '../session';

const user: SessionUser = {
  id: 'u1',
  name: 'Nina',
  email: 'nina@anteraja.id',
  hub_id: 'hub-1',
  hub_name: 'Hub Halim',
  role: 'admin',
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sesi "ingat saya" (localStorage)', () => {
  it('menyimpan token, profil, dan stempel waktu login', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_770_000_000_000);

    setSession('tok-lokal', user, true);

    expect(getToken()).toBe('tok-lokal');
    expect(getUser()).toEqual(user);
    expect(getLoginAt()).toBe(1_770_000_000_000);
    expect(isRemembered()).toBe(true);
    expect(hasSession()).toBe(true);
    expect(sessionStorage.getItem('anteraja.token')).toBeNull();
  });
});

describe('sesi tanpa "ingat saya" (sessionStorage)', () => {
  it('menyimpan token hanya di sessionStorage', () => {
    setSession('tok-tab', user, false);

    expect(getToken()).toBe('tok-tab');
    expect(localStorage.getItem('anteraja.token')).toBeNull();
    expect(isRemembered()).toBe(false);
    expect(getLoginAt()).toBeGreaterThan(0);
  });

  it('menghapus token lama di penyimpanan lain supaya tidak ada sesi ganda', () => {
    setSession('tok-lokal', user, true);
    setSession('tok-tab', user, false);

    expect(localStorage.getItem('anteraja.token')).toBeNull();
    expect(localStorage.getItem('anteraja.user')).toBeNull();
    expect(getToken()).toBe('tok-tab');
  });
});

describe('pembacaan sesi', () => {
  it('localStorage lebih dulu saat kedua penyimpanan terisi', () => {
    localStorage.setItem('anteraja.token', 'dari-lokal');
    sessionStorage.setItem('anteraja.token', 'dari-tab');

    expect(getToken()).toBe('dari-lokal');
  });

  it('getUser mengembalikan null untuk JSON rusak', () => {
    localStorage.setItem('anteraja.user', '{tidak-valid');

    expect(getUser()).toBeNull();
  });

  it('getLoginAt mengembalikan null untuk nilai yang bukan angka', () => {
    sessionStorage.setItem('anteraja.loginAt', 'bukan-angka');

    expect(getLoginAt()).toBeNull();
  });

  it('getLoginAt mengembalikan null bila belum pernah login', () => {
    expect(getLoginAt()).toBeNull();
    expect(hasSession()).toBe(false);
  });
});

describe('clearSession', () => {
  it('menghapus token, profil, bendera remember, dan stempel login', () => {
    setSession('tok-lokal', user, true);

    clearSession();

    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(getLoginAt()).toBeNull();
    expect(isRemembered()).toBe(false);
    expect(hasSession()).toBe(false);
  });
});

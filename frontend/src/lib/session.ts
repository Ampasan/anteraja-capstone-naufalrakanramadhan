/**
 * Penyimpanan sesi autentikasi (token Sanctum + profil admin hub).
 *
 * "Ingat saya"  -> localStorage (bertahan setelah browser ditutup)
 * Tanpa centang  -> sessionStorage (hilang saat tab ditutup)
 *
 * Bendera "remember" disimpan di localStorage agar halaman login berikutnya
 * tahu ke mana token harus ditulis/dibaca.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  hub_id: string;
  hub_name: string;
  role?: string;
}

const TOKEN_KEY = 'anteraja.token';
const USER_KEY = 'anteraja.user';
const REMEMBER_KEY = 'anteraja.remember';

export function isRemembered(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Baca token. Cek localStorage lebih dulu (sesi "ingat saya"), lalu
 * sessionStorage — sehingga token lama tidak pernah tertinggal setelah
 * pengguna berganti preferensi.
 */
export function getToken(): string | null {
  try {
    return (
      window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function getUser(): SessionUser | null {
  try {
    const raw =
      window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return getToken() !== null;
}

export function setSession(token: string, user: SessionUser, rememberMe: boolean): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, rememberMe ? '1' : '0');
    const store = rememberMe ? window.localStorage : window.sessionStorage;
    // Bersihkan pasangan di penyimpanan lain agar tidak ada token ganda.
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Penyimpanan diblokir (private mode) — sesi hanya bertahan di memori,
    // API tetap berjalan karena token diambil dari variabel runtime oleh caller.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  } catch {
    // abaikan
  }
}

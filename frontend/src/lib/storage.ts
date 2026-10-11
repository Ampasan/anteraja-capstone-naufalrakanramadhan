/** sessionStorage berbasis JSON. Gagal diam-diam: penyimpanan bisa penuh atau diblokir privasi. */

export function readStored<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Penuh atau diblokir: fitur perekam yang hilang, bukan kerusakan halaman.
  }
}

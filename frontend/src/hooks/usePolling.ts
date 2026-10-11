import { useEffect } from 'react';

/**
 * Jalankan `run` segera saat dipasang, lalu ulangi tiap `intervalMs`.
 *
 * Interval dijeda selama tab tersembunyi dan langsung menyegarkan data begitu
 * tab kembali terlihat. Hasilnya sama bagi pengguna — data selalu segar saat
 * halaman terlihat — tetapi tab di latar belakang tidak lagi menghantam API
 * tanpa henti.
 *
 * Efek ini berjalan ulang saat identitas `run` berubah, persis seperti pola
 * polling yang sebelumnya ditulis manual di tiap hook: mengganti filter tetap
 * langsung memicu pemuatan baru. `runImmediately` dimatikan bila pemuatan saat
 * efek berjalan sudah ditangani efek lain, agar tidak ada permintaan ganda.
 */
export function usePolling(run: () => void, intervalMs: number, runImmediately = true): void {
  useEffect(() => {
    if (runImmediately) void run();

    let timer = 0;

    const start = () => {
      if (timer) return;
      timer = window.setInterval(() => void run(), intervalMs);
    };

    const pause = () => {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
    };

    const resume = () => {
      if (timer) return;
      void run();
      start();
    };

    const handleVisibility = () => (document.hidden ? pause() : resume());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      pause();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [run, intervalMs, runImmediately]);
}

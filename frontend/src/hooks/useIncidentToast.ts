import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapIncidentAlert } from '../lib/mappers';
import type { IncidentReport } from '../features/incidents/types';
import type { IncidentAlert } from '../features/monitoring/types';

/**
 * Toast peringatan insiden untuk halaman Live Monitoring.
 */
export const TOAST_DELAY_MS = 5_000;

export interface IncidentToastState {
  /** True bila ada insiden aktif, jeda lewat, dan belum ditutup user. */
  visible: boolean;
  alert: IncidentAlert | null;
  /** Insiden penuh di balik toast, dipakai tombol "Alihkan Paket". */
  incident: IncidentReport | null;
  /** Sembunyikan toast sampai muat halaman berikutnya. */
  dismiss: () => void;
}

/**
 * Toast insiden untuk Live Monitoring.a.
 */
export function useIncidentToast(incidents: IncidentReport[]): IncidentToastState {
  const [visible, setVisible] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Ref hanya dibaca di dalam callback/timer, bukan saat render.
  const dismissedRef = useRef(false);
  const shownRef = useRef(false);
  const activeRef = useRef<IncidentReport[]>([]);

  const active = useMemo(
    () => incidents.filter((incident) => incident.status !== 'RESOLVED'),
    [incidents],
  );
  const alerts = useMemo(() => active.map(mapIncidentAlert), [active]);

  // Selalu sediakan daftar insiden terbaru untuk timer yang dibuat saat mount.
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ── Satu penundaan tiap muat halaman: 5 detik sejak peta dipasang ──
  useEffect(() => {
    let timer = window.setTimeout(arm, TOAST_DELAY_MS);

    function arm(): void {
      if (shownRef.current || dismissedRef.current) return;

      const first = activeRef.current[0];
      if (!first) {
        // Belum ada insiden aktif: coba lagi nanti, tetap satu kali tampil.
        timer = window.setTimeout(arm, TOAST_DELAY_MS);
        return;
      }

      shownRef.current = true;
      setPinnedId(first.id);
      setVisible(true);
    }

    return () => window.clearTimeout(timer);
  }, []);

  const [incident, alert] = useMemo<[IncidentReport | null, IncidentAlert | null]>(() => {
    if (!pinnedId) return [null, null];

    const index = active.findIndex((item) => item.id === pinnedId);
    if (index === -1) return [null, null];

    return [active[index], alerts[index] ?? null];
  }, [pinnedId, active, alerts]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setDismissed(true);
    setVisible(false);
  }, []);

  return {
    visible: visible && !dismissed && pinnedId !== null && incident !== null,
    alert,
    incident,
    dismiss,
  };
}

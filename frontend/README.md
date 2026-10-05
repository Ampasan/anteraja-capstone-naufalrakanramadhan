# Frontend — Courier Admin Mini-Panel Anteraja

Dashboard *single-screen* untuk Admin Hub memantau kurir SATRIA, mengelola risiko SLA, menangani insiden, dan mengeksekusi pengalihan 1-klik. Dibangun dengan React + TypeScript + Vite + Tailwind CSS + React-Leaflet.

## Menjalankan

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173. Base URL API dibaca dari `VITE_API_URL` di `.env`:

```
VITE_API_URL=http://localhost/anteraja-capstone/backend/public/api
```

## Akun Demo

| Email | Password | Hub |
|-------|----------|-----|
| siti.admin@anteraja.id | Anteraja2026! | Hub Halim - Jakarta Timur |

## Halaman

| Route | Keterangan |
|-------|-----------|
| `/login` | Login (redirect ke `/monitoring` setelah sukses) |
| `/monitoring` | Peta live + daftar kurir. Query `?courier=:id` untuk auto-focus dari SLA panel |
| `/sla` | Panel risiko SLA (auto-sort ascending, filter, peta cross-highlight) |
| `/incidents` | Insiden & pengalihan 1-klik. Auto-navigate ke `/audit` setelah reassign |
| `/audit` | Riwayat audit log + ekspor CSV/XLSX/PDF |
| `*` | 404 |

## Perintah

```bash
npm run dev       # dev server (port 5173)
npm run build     # build produksi ke dist/
npm run preview   # preview build produksi
npm run lint      # ESLint
npm run test      # Vitest + Testing Library (198 test, 21 berkas)
```

## Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Peta | React-Leaflet |
| State | Custom hooks + Context API (selectedCourierId) |
| HTTP | `src/lib/api.ts` — envelope `{ ok, data, message }`, micro-cache GET |
| Real-time | `src/lib/realtime.ts` — Laravel Reverb (4 event) |
| Pengujian | Vitest + Testing Library + MSW |

## Struktur

```
src/
  features/
    auth/           LoginPage, HubSelect, LoginForm, useAuth
    monitoring/     MonitoringPage, MapView, RoadPolyline, CourierList, CourierCard, MapControls, CourierDetailPanel, IncidentAlertToast, useMonitoring, useCourierMotion
    sla-risk/       SlaRiskPage, SlaTable, SlaSummaryCards, SlaFilterBar, SlaDetailModal, useSlaRisk
    incidents/      IncidentsPage, IncidentList, IncidentFilterBar, IncidentSummaryCards, ReassignPanel, ReassignSuccessModal, IncidentExportDropdown, useIncidents
    audit-logs/     AuditLogsPage, AuditTable, AuditFilterBar, AuditSummaryCards, ExportDropdown, useAuditLogs
  components/
    layout/         Header, Sidebar, MainLayout
    ui/             Button, Card, Badge, Modal, Input
    evidence/       EvidencePhotoModal
  hooks/            useDashboardSummary, useHubs, useIncidentToast, useRealtime
  lib/              api.ts, mappers.ts, roadRoute.ts, courierJourney.ts, storage.ts, realtime.ts, session.ts, prefetch.ts
  context/          AppContext, useAppContext
```

## Pola Penting

- **Satu arah data:** parent → child via props, tidak ada mutasi props di child
- **Derived state:** `filteredCouriers`, `counts` pakai `useMemo`, bukan state terpisah
- **Real-time:** `useRealtime()` berlangganan 4 event Reverb setelah login; marker peta dipindahkan via `updateMarker()` (tanpa full re-render)
- **Cache GET:** `apiCached(path, ttlMs)` — cache memori + `inFlight` dedup (maks 100 entri). Bila memori kosong, hasil terakhir ikut disimpan ke `sessionStorage` (`anteraja.api.cache`, 8 entri) supaya refresh menampilkan data lama dulu lalu diamkan di latar (`stale-while-revalidate`), dan polling berhenti selama tab tersembunyi
- **Perjalanan kurir:** `courierJourney.ts` merekam titik awal sekali per tab (`anteraja.monitoring.origins`). Penanda merambat di atas geometri jalan menuju titik drop dan berhenti di sana; refresh atau pindah halaman mengulang perjalanan dari titik yang sama
- **Rute di peta:** `roadRoute.ts` membentuk ulang garis kurir → drop mengikuti jaringan jalan (OSRM), hasilnya di-cache per sel ±55 m; kalau layanan routing tidak terjangkau, garis lurus yang dipakai. `RoadPolyline` menolak geometri yang sudah tertinggal lebih dari 150 m dari penanda
- **202 Accepted:** `apiWithStatus()` membedakan `accepted` (job async) dari `success` — dipakai untuk pengalihan 1-klik

## Build & Deploy

Build menghasilkan `dist/`. Untuk produksi, salin `dist/` ke `backend/public/` atau folder web server Anda. Pastikan `VITE_API_URL` mengarah ke endpoint API yang benar.

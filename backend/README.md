# Backend — Courier Admin Mini Panel (Anteraja)

Backend Laravel 12 untuk **Sistem Monitoring & Eskalasi SLA Anteraja** pada Hub
Halim. Menyediakan REST API untuk modul F-01 s/d F-05 sesuai `docs/00-PRD` dan
`docs/frd/`.

- **Database:** PostgreSQL (Supabase) — kredensial di `.env`
- **Autentikasi:** Laravel Sanctum (token bearer)
- **Foto bukti:** Cloudinary
- **Antarmuka:** `../frontend` (React + Vite) — kontrak envelope di
  `frontend/src/lib/api.ts`

---

## Menjalankan

```bash
cd backend

# 1. sekali saja
composer install
php artisan key:generate
php artisan migrate --seed
php artisan optimize          # cache config + route + view

# 2. setiap sesi kerja (buka 4 terminal)
php artisan serve --port=8000   # API
php artisan queue:listen        # job NotifikasiPengalihan + broadcast realtime
php artisan schedule:work       # laporan harian + eskalasi insiden
php artisan reverb:start        # server WebSocket port 8080 (realtime PRD F-01/F-03)
```

> Setelah mengubah `.env`, jalankan `php artisan config:clear` lalu
> `php artisan optimize` kembali — konfigurasi dalam keadaan ter-cache.

---

## Realtime (Laravel Reverb)

Empat event di `app/Events/` disiarkan ke channel **`hub.{hubId}`** dengan nama:

| Event | `broadcastAs()` | Dipicu oleh |
|-------|-----------------|-------------|
| `IncidentReported` | `incident.reported` | `POST /api/incidents` |
| `IncidentEscalated` | `incident.escalated` | `incident:escalate` (> 10 menit) |
| `ReassignmentCompleted` | `incident.reassigned` | `POST /api/incidents/{id}/reassign` |
| `CourierTelemetryUpdated` | `courier.telemetry` | `POST /api/couriers/{id}/telemetry` |

Semua event memakai `ShouldBroadcast` (antrean), **bukan** `ShouldBroadcastNow`:

- request API tidak pernah menunggu HTTP POST ke Reverb → endpoint tetap di
  bawah angka dasar query-nya;
- selama `php artisan queue:listen` berjalan, alert tetap sampai ke dasbor jauh
  di bawah batas 5 detik FRD-03;
- bila Reverb dimatikan, job gagal tercatat di `failed_jobs` — **API tetap
  merespons normal** (lihat `GET /api/health` → `queue.failed_jobs`).

Konfigurasi di `.env`:

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID / REVERB_APP_KEY / REVERB_APP_SECRET   # identitas aplikasi
REVERB_HOST=127.0.0.1   REVERB_PORT=8080   REVERB_SCHEME=http
REVERB_SERVER_HOST / REVERB_SERVER_PORT               # alamat bind server
```

Di frontend nanti cukup pasang `laravel-echo` + `pusher-js`:

```js
Echo.channel(`hub.${hubId}`)
    .listen('.incident.reported', ({ incident }) => /* alarm + pop-up */)
    .listen('.courier.telemetry', ({ courier }) => /* geser pin peta */);
```

---

## Mengaktifkan Redis (opsional)

`predis/predis` sudah terpasang dan `REDIS_*` sudah terisi, tinggal aktifkan
begitu ada server Redis:

```bash
docker run -d --name anteraja-redis -p 6379:6379 redis:7-alpine
```

lalu di `.env` ganti `CACHE_STORE=file` → `CACHE_STORE=redis` dan/atau
`QUEUE_CONNECTION=database` → `QUEUE_CONNECTION=redis`, lanjutkan dengan
`php artisan config:clear && php artisan optimize`. Bila Redis belum tersedia,
biarkan kedua nilai bawaan — semuanya tetap jalan dengan driver `file` dan
`database`.

---

## Struktur

```
app/
  Console/Commands/     report:daily-incidents, incident:escalate
  Events/               4 event broadcast realtime (Incident*, CourierTelemetry*)
  Exports/              Ekspor XLSX (Rekap KPI + Rincian Transaksi)
  Http/Controllers/     6 controller untuk 19 endpoint
  Http/Middleware/      SecurityHeaders, Authenticate (alias `auth`)
  Http/Requests/        Validasi StoreIncident / ReassignIncident
  Jobs/                 NotifikasiPengalihan (async, afterCommit)
  Models/               12 model dengan UUID primary key
  Services/             Cloudinary, Auth, Courier, Incident, Order, AuditLog
config/reverb.php        Konfigurasi server WebSocket Reverb
resources/views/
  exports/              Templat laporan audit log untuk ekspor PDF
routes/api.php          19 endpoint (public + `auth:sanctum`)
```

---

## Endpoint

Dokumentasi lengkap (payload, status code, contoh): **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
— koleksi request siap impor: [postman_collection.json](./postman_collection.json).

| Metode | Path | Modul |
|--------|------|-------|
| POST | `/api/auth/login` | F-05 Login |
| GET | `/api/auth/me`, `/api/auth/logout` | F-05 |
| GET | `/api/hubs` | F-05 dropdown |
| GET | `/api/dashboard/summary` | F-01 ringkasan |
| GET | `/api/couriers` | F-01 live monitoring map |
| GET | `/api/couriers/{id}` | F-01 detail kurir |
| GET | `/api/couriers/candidates` | F-03 kandidat kurir pengganti |
| POST | `/api/couriers/{id}/telemetry` | F-01 pembaruan posisi |
| GET | `/api/orders/sla-risk` | F-02 panel risiko SLA |
| GET / POST | `/api/incidents` | F-03 laporan kendala |
| GET | `/api/incidents/export` | F-03 laporan insiden harian (CSV) |
| POST | `/api/incidents/{id}/reassign` | F-03 pengalihan 1-klik |
| POST | `/api/incidents/{id}/upload-evidence` | F-03 foto bukti |
| GET | `/api/audit-logs` | F-04 riwayat |
| GET | `/api/audit-logs/export?format=csv\|xlsx\|pdf` | F-04 ekspor laporan |
| GET | `/api/health`, `/api/ping` | kesehatan layanan |

Semua response memakai envelope `{ ok, data, message }`.

---

## Perintah artisan

```bash
php artisan report:daily-incidents --date=2026-10-01   # laporan insiden -> CSV
php artisan incident:escalate --minutes=10             # REPORTED -> ESCALATED
php artisan db:seed --class=IncidentSeeder             # segarkan data demo
php artisan optimize                                   # cache config/route/view
```

| Command | Jadwal (Console/Kernel) | Rujukan FRD |
|---------|------------------------|-------------|
| `report:daily-incidents` | tiap hari 08:00 WIB | F-04 laporan |
| `incident:escalate` | tiap menit | FRD-03 / BR-04 |

---

## Aturan bisnis penting

**Pengalihan 1-klik (FRD-03)** — semuanya memakai angka yang sama, berasal dari
`CourierReplacementService::MAX_ACTIVE_PARCELS` (10) dan `isCompatible()`:

| Kondisi | Hasil |
|---------|-------|
| Resi sudah dialihkan < 1 menit | `409 Conflict` |
| Kurir tujuan membawa > 10 paket | `422` |
| Kapasitas muatan kurang | `422` |
| Armada tidak kompatibel (Cargo ≠ Van/Truk, Frozen tanpa tas termal, PHARMA tanpa BPOM) | `422` |
| Paket sudah `DELIVERED` | `422` |

**Kompatibilitas armada** memakai kolom `couriers.is_bpom_certified` dan
`couriers.has_thermal_box`.

**Eskalasi (FRD-03 / BR-04)** — insiden `REPORTED` yang tidak ditanggapi
> 10 menit otomatis menjadi `ESCALATED` + panel cache dibersihkan.

---

## Optimasi & cache

| Data | TTL | Dibersihkan oleh |
|------|-----|------------------|
| `dashboard_summary_`, `audit_logs_`, `incidents_` | 30 detik | `IncidentService::clearPanelCache()` |
| `sla_risk_orders_`, `couriers_` | 10 detik | sama + refresh alami |
| `hub_` | 5 menit | jarang berubah |

Pendorong utama waktu respons bukan kode aplikasi, melainkan latency jaringan ke
Supabase (Singapura). Terukur di mesin ini: TCP ke pooler **± 100 ms** dan
`SELECT 1` berulang **160–300 ms** — jadi tiap round-trip query praktis bernilai
± 200 ms dan jumlah query menentukan waktu respons. Optimasi yang sudah
dilakukan:

- `search_path => null` di `config/database.php` (menghapus 1 round-trip
  `SET search_path` per koneksi)
- koneksi PDO persisten (`DB_PERSISTENT=true`)
- `sanctum.last_used_at = false` (menghapus 1 UPDATE per request)
- agregasi dashboard dirangkum jadi 1 SQL mentah
- relasi eager-load dipangkas sesuai field yang benar-benar dirender
- saat insiden dibuat, `order` / `courier` / `evidences` dipasang langsung
  sebagai relasi (hemat 3 query) dan saat reassign status insiden di-update
  sekali saja + kurir pelapor dipakai dari relasi (hemat 2 query)

Hasil pengukuran hangat:

| Kelompok | Waktu | Keterangan |
|----------|-------|------------|
| GET panel (dashboard, incidents, couriers, audit, sla-risk) | **470–950 ms** | cache terisi |
| Ekspor CSV / XLSX / PDF | **< 1,1 detik** | target FRD-04 < 3,0 detik |
| `POST /api/incidents` | **± 2,0 detik** | 7 query (tulis + kandidat + job broadcast) |
| `POST /api/incidents/{id}/reassign` | **± 4,5 detik** | ± 19 query dalam 1 transaksi + lock |

---

## Pengujian

```bash
php artisan test            # PHPUnit
```

Smoke test API (login -> semua endpoint -> ekspor) dijalankan manual terhadap
server `localhost:8000`.

---

## Catatan frontend

`frontend/src/lib/api.ts` menentukan base URL dari `VITE_API_URL`. Pastikan
`.env` frontend berisi:

```
VITE_API_URL=http://localhost:8000/api
```

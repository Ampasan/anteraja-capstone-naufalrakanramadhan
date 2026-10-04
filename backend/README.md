# Backend — Courier Admin Mini Panel (Anteraja)

Backend Laravel untuk **Sistem Monitoring & Eskalasi SLA Anteraja** pada Hub Halim. REST API + WebSocket (Laravel Reverb) untuk 5 modul: Live Monitoring Map, SLA Risk Panel, Incident & Reassignment Center, Audit Log, dan Login.

## Stack

- **Database:** PostgreSQL (Supabase) 
- **Cache / antrean / sesi:** Redis 
- **Auth:** Laravel Sanctum (token bearer)
- **Foto bukti:** Cloudinary
- **Real-time:** Laravel Reverb (WebSocket)
- **Frontend:** React + Vite

## Menjalankan

```bash
cd backend

# Sekali saja
composer install
php artisan key:generate
php artisan migrate --seed
php artisan optimize

# Setiap sesi kerja (4 terminal)
php artisan serve --port=8000   # API
php artisan queue:listen        # job NotifikasiPengalihan + broadcast
php artisan schedule:work       # laporan harian + eskalasi insiden
php artisan reverb:start        # WebSocket port 8080
```

## Akun Demo

| Email | Password |
|-------|----------|
| siti.admin@anteraja.id | Anteraja2026! |


## Endpoint API

Envelope response: `{ ok, data, message }`. Dokumentasi lengkap: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

| Metode | Path | Modul |
|--------|------|-------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me`, `/api/auth/logout` | Auth |
| GET | `/api/hubs` | Dropdown hub |
| GET | `/api/dashboard/summary` | Ringkasan dashboard |
| GET | `/api/couriers` | Daftar kurir + telemetri |
| GET | `/api/couriers/{id}` | Detail kurir |
| GET | `/api/couriers/candidates` | Kandidat pengganti |
| POST | `/api/couriers/{id}/telemetry` | Update posisi |
| GET | `/api/orders/sla-risk` | Panel risiko SLA |
| GET | `/api/tugas/tabel` | Tabel tugas (server-side) |
| GET/POST | `/api/incidents` | Laporan insiden |
| GET | `/api/incidents/export` | Ekspor CSV/XLSX/PDF |
| POST | `/api/incidents/{id}/reassign` | Pengalihan 1-klik |
| POST | `/api/incidents/{id}/upload-evidence` | Upload foto bukti |
| GET | `/api/audit-logs` | Riwayat audit |
| GET | `/api/audit-logs/export` | Ekspor laporan |
| GET | `/api/health`, `/api/ping` | Health check |

## Perintah Artisan

```bash
php artisan test                              # PHPUnit: 174 test
php artisan db:seed --class=IncidentSeeder    # Segarkan data demo
php artisan incident:escalate --minutes=10   # REPORTED -> ESCALATED
php artisan risk:rebuild                      # Ulangi peringkat risiko (Redis)
php artisan report:daily-incidents            # Laporan insiden harian
```

## Aturan Bisnis Utama

- **Pengalihan 1-klik:** (`MAX_ACTIVE_PARCELS`), validasi armada (Cargo → Van/Truk, Frozen → tas termal, PHARMA → BPOM), kapasitas muatan, resi tidak DELIVERED, tidak ada pengalihan ganda
- **Eskalasi:** insiden `REPORTED` > 10 menit otomatis `ESCALATED`
- **Audit log:** *immutable* (trigger database menolak UPDATE/DELETE)

## Realtime (Laravel Reverb)

Event di channel `hub.{hubId}`:

| Event | `broadcastAs()` |
|-------|-----------------|
| `IncidentReported` | `incident.reported` |
| `IncidentEscalated` | `incident.escalated` |
| `ReassignmentCompleted` | `incident.reassigned` |
| `CourierTelemetryUpdated` | `courier.telemetry` |

Semua event memakai `ShouldBroadcast` (antrean) — API tidak menunggu HTTP POST ke Reverb. Bila Reverb mati, job gagal tercatat di `failed_jobs` dan API tetap merespons normal (lihat `GET /api/health`).

## Struktur

```
app/
  Console/Commands/     incident:escalate, risk:rebuild, report:daily-incidents, sla:refresh
  Events/               4 event broadcast realtime
  Exports/              Ekspor XLSX/CSV/PDF
  Http/Controllers/     6 controller, 19 endpoint
  Http/Middleware/      SecurityHeaders, Authenticate
  Jobs/                 NotifikasiPengalihan (async, afterCommit)
  Models/               10 model dengan UUID primary key
  Services/             Auth, Courier, Incident, Order, AuditLog, Cloudinary
  Support/              OperationalClock, CourierRoute, TabelQuery
config/                 app, database, sanctum, reverb, cloudinary, excel
routes/api.php          19 endpoint (public + auth:sanctum)
```

## Optimasi

- **Database remote (Supabase):** ±170 ms per round-trip → jumlah query menentukan waktu respons
- Index foreign key lengkap (6 index tambahan di migration `2026_10_04_000000`)
- Cache Redis: dashboard 30s, audit 30s, incidents 30s, SLA 10s, couriers 10s, hub 5 menit
- `search_path => null`, PDO persisten, `sanctum.last_used_at = false`

## Pengujian

```bash
php artisan test    # 174 test (Unit, Feature, Performance)
```

Detail: [`docs/TESTING.md`](../docs/TESTING.md)

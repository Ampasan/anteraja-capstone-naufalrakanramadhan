# Courier Admin Mini-Panel Anteraja

Sistem monitoring dan eskalasi SLA *real-time* untuk operasional last-mile Anteraja di Hub Halim, Jakarta Timur. Dibangun dengan Laravel (backend) + React + React-Leaflet (frontend) + PostgreSQL (Supabase) + Redis + Laravel Reverb (WebSocket).

## Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| **Live Monitoring Map** | Peta interaktif React-Leaflet untuk memantau posisi kurir SATRIA, *drop point*, dan suhu *cold-chain* secara *real-time* |
| **SLA Risk Indicator Panel** | Panel tabel yang mengurutkan paket berdasarkan sisa waktu SLA dengan pengkodean warna dinamis (Merah/Kuning/Hijau) |
| **Incident & Reassignment Center** * | Penerimaan laporan kendala *real-time* dan pengalihan tugas 1-klik dengan validasi kualifikasi armada |
| **Audit Log & Riwayat Operasional** | Rekapitulasi *audit trail immutable* dan ekspor laporan PDF/CSV |
| **Login & Authentication** | Autentikasi berbasis token Laravel Sanctum dengan *lockout* 15 menit setelah 5x gagal |

## Struktur Proyek

```
anteriora-capstone/
├── backend/          # Laravel API + WebSocket (Reverb)
├── frontend/         # React + Vite + Tailwind CSS + React-Leaflet
├── docs/             # Dokumentasi (PRD, FRD, schema, seed, testing)
└── README.md         # File ini
```

## Quick Start

### Backend

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan optimize

# Jalankan 4 terminal terpisah:
php artisan serve --port=8000   # API
php artisan queue:listen        # Job antrean
php artisan schedule:work       # Simulasi posisi kurir + laporan harian + eskalasi
php artisan reverb:start        # WebSocket port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173

## Akun Demo

| Email | Password | Hub |
|-------|----------|-----|
| siti.admin@anteraja.id | Anteraja2026! | Hub Halim - Jakarta Timur |

## Dokumentasi

- [PRD](./docs/00-PRD-courier-admin-mini-panel.md) — Product Requirement Document
- [FRD Induk](./docs/FRD-00-courier-admin-mini-panel.md) — Functional Requirement Document (Master)
- [FRD-01 Live Monitoring Map](./docs/frd/FRD-01-live-monitoring-map.md)
- [FRD-02 SLA Risk Indicator Panel](./docs/frd/FRD-02-sla-risk-indicator-panel.md)
- [FRD-03 Incident & Reassignment Center](./docs/frd/FRD-03-incident-and-reassignment-center.md)
- [FRD-04 Audit Log & Riwayat Operasional](./docs/frd/FRD-04-audit-log-and-history.md)
- [FRD-05 Login & Authentication](./docs/frd/FRD-05-login-authentication.md)
- [Schema Database](./docs/schema.sql)
- [Seed Data](./docs/seed.sql)
- [Testing](./docs/TESTING.md)

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel, PHP |
| Database | PostgreSQL (Supabase) |
| Cache/Queue | Redis |
| WebSocket | Laravel Reverb |
| Auth | Laravel Sanctum |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Map | React-Leaflet |
| Testing | PHPUnit, Vitest |

## API Endpoint

Semua endpoint memakai envelope `{ ok, data, message }`.

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

Lihat [API Documentation](./backend/API_DOCUMENTATION.md) untuk detail lengkap.

## KPI Target

| KPI | Target |
|-----|--------|
| Kepatuhan SLA | ≥ 97.5% |
| Durasi Reassignment | < 30 detik |
| Re-delivery Rate | < 2.0% |
| Pesan Chat Manual | < 25 pesan/hari |
| Akselerasi Respon Kendala | 75% |

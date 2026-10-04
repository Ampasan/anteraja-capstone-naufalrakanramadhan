# API Documentation - Courier Admin Mini Panel

## Base URL
```
http://localhost:8000/api
```

## Response Envelope
Semua response menggunakan format konsisten:
```json
{
  "ok": true|false,
  "data": { ... },
  "message": "string"
}
```

## Authentication
Endpoint yang memerlukan autentikasi menggunakan Bearer Token:
```
Authorization: Bearer {token}
```

---

## Public Endpoints

### 1. Get Hubs
**GET** `/api/hubs`

Response:
```json
{
  "ok": true,
  "data": {
    "hubs": [
      {
        "id": "uuid",
        "name": "ANTERAJA HUB HALIM",
        "short_name": "HUB HALIM",
        "city": "Jakarta Timur",
        "position": { "lat": -6.2651893, "lng": 106.8767953 },
        "radius_km": 5,
        "capacity_used": 2410,
        "capacity_total": 2850
      }
    ]
  },
  "message": "OK"
}
```

### 2. Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "siti.admin@anteraja.id",
  "password": "Anteraja2026!",
  "hub_id": "uuid"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Siti Rahmawati",
      "email": "siti.admin@anteraja.id",
      "hub_id": "uuid",
      "hub_name": "ANTERAJA HUB HALIM",
      "role": "admin"
    },
    "token": "string"
  },
  "message": "Login berhasil"
}
```

---

## Protected Endpoints

### 3. Logout
**POST** `/api/auth/logout`

### 4. Get Current User
**GET** `/api/auth/me`

### 5. Dashboard Summary
**GET** `/api/dashboard/summary`

Response:
```json
{
  "ok": true,
  "data": {
    "hub": { ... },
    "couriers": { "total": 10, "online": 3, "idle": 5 },
    "orders": { "active": 8, "critical": 2 },
    "incidents": { "open": 2 }
  }
}
```

### 6. Get Couriers (Live Monitoring Map)
**GET** `/api/couriers`

Response:
```json
{
  "ok": true,
  "data": {
    "couriers": [
      {
        "id": "uuid",
        "courier_code": "HLM-001",
        "name": "Budi Santoso",
        "status": "ONLINE",
        "vehicle_type": "Motorcycle",
        "position": { "lat": -6.2678, "lng": 106.8812 },
        "telemetry": { ... },
        "hub_position": { ... }
      }
    ],
    "total": 8,
    "online": 3,
    "idle": 5
  }
}
```

### 7. Get Courier Detail
**GET** `/api/couriers/{id}`

Detail kurir beserta paket aktif.

### 8. Update Courier Telemetry
**POST** `/api/couriers/{id}/telemetry`

Request:
```json
{
  "latitude": -6.2678,
  "longitude": 106.8812,
  "speed_kmh": 22.5,
  "temperature_c": null,
  "battery_level": 92
}
```

### 9. Get SLA Risk Orders
**GET** `/api/orders/sla-risk`

Response:
```json
{
  "ok": true,
  "data": {
    "orders": [
      {
        "waybill_number": "100024000009",
        "service_type": "Frozen",
        "remaining_minutes": 12,
        "risk_level": "Kritis",
        "risk_label": "Sangat Tinggi",
        "risk_color": "red"
      }
    ],
    "summary": { "kritis": 2, "waspada": 3, "aman": 3, "total": 8 }
  }
}
```

### 10. Get Incidents
**GET** `/api/incidents`

Response:
```json
{
  "ok": true,
  "data": {
    "incidents": [
      {
        "id": "uuid",
        "incident_code": "INC-HLM-083",
        "severity": "WARNING",
        "status": "REPORTED",
        "waybill_number": "100024000009",
        "courier": { ... },
        "candidates": [ ... ]
      }
    ],
    "total": 2
  }
}
```

### 11. Create Incident
**POST** `/api/incidents`

Request:
```json
{
  "order_number": "100024000009",
  "courier_id": "uuid",
  "incident_category": "Anomali Suhu",
  "title": "Pendingin Tidak Stabil",
  "description": "Suhu box pendingin melonjak"
}
```

### 12. Reassign Incident (1-Click)
**POST** `/api/incidents/{id}/reassign`

Request:
```json
{
  "replacement_courier_id": "uuid"
}
```

Response (Success):
```json
{
  "ok": true,
  "data": {
    "confirmation_id": "uuid",
    "confirmation_code": "RSC-HLM-xxx",
    "audit_log_id": "uuid",
    "new_courier": { ... }
  },
  "message": "Pengalihan berhasil!"
}
```

Response (Conflict - 409):
```json
{
  "ok": false,
  "message": "Resi ini baru saja dialihkan. Silakan tunggu 1 menit sebelum mencoba lagi."
}
```

Response (Unprocessable - 422):
```json
{
  "ok": false,
  "message": "Kurir tujuan sudah membawa lebih dari 10 paket. Pilih kurir lain."
}
```

### 13. Upload Evidence Photo
**POST** `/api/incidents/{id}/upload-evidence`

Content-Type: `multipart/form-data`

Request:
- `photo`: File image (jpeg, png, jpg, max 5MB)
- `caption`: String (optional)

Response:
```json
{
  "ok": true,
  "data": {
    "evidence": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "foto_bukti/...",
      "format": "jpg",
      "bytes": 245120
    }
  },
  "message": "Foto bukti berhasil diupload"
}
```

### 14. Get Audit Logs
**GET** `/api/audit-logs`

Response:
```json
{
  "ok": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "log_code": "AUD-HLM-2026-0104",
        "resi": "100024000104",
        "service_type": "Next Day",
        "completed_at": "2026-09-24T14:15:00Z",
        "from_courier": "Indra Gunawan",
        "to_courier": "Eko Prasetyo",
        "incident_category": "Cuaca / Hujan",
        "handling_seconds": 18.0,
        "sla_compliant": true
      }
    ],
    "summary": {
      "total_completed": 5,
      "avg_handling_seconds": 20.0,
      "sla_compliance_rate": 100.0,
      "sla_compliant_count": 5
    }
  }
}
```

### 15. Export Audit Logs
**GET** `/api/audit-logs/export?format=csv|xlsx|pdf`

Parameter query `format` (opsional, default `csv`):

| Format | Isi berkas | Library |
|--------|-----------|---------|
| `csv`  | Blok **Rekapitulasi KPI**, baris kosong, lalu tabel rincian (kolom terakhir: Foto Bukti (URL)) | penulisan langsung (`fputcsv`) |
| `xlsx` | Sheet **Rekap KPI** + sheet **Rincian Transaksi** | `maatwebsite/excel` |
| `pdf`  | Rekapitulasi KPI + tabel rincian transaksi | `barryvdh/laravel-dompdf` |


### 16. Get Replacement Candidates
**GET** `/api/couriers/candidates`

Query parameter:

| Param | Wajib | Keterangan |
|-------|-------|------------|
| `exclude_id` | Ya | ID kurir yang sedang bermasalah (tidak boleh dipilih) |
| `order_id` | Tidak | ID order — untuk menyaring **kompatibilitas armada** |
| `weight_kg` | Tidak | Bobot muatan; jika kosong diambil dari `order_id` |

Penyaringan mengikuti FRD-03 / BR-02:
- status `ONLINE` atau `IDLE`
- beban paket aktif **≤ 10** (`CourierReplacementService::MAX_ACTIVE_PARCELS`)
- kapasitas muatan ≥ bobot paket
- armada kompatibel: `Cargo` = Van/Truk (bukan motor), `Frozen` = tas termal,
  `PHARMA` = bersertifikat BPOM


Response:
```json
{
  "ok": true,
  "data": {
    "candidates": [
      {
        "id": "uuid",
        "courier_code": "HLM-004",
        "name": "Fajar Ramadhan",
        "initials": "FR",
        "vehicle_type": "Van",
        "status": "ONLINE",
        "current_parcel_count": 8,
        "max_capacity_kg": 1200,
        "is_recommended": true,
        "badge": "Rekomendasi Utama"
      }
    ],
    "total": 1,
    "is_recommended": true,
    "note": null
  },
  "message": "OK"
}
```

Jika tidak ada kandidat yang lolos, `candidates` kosong dan `note` berisi
peringatan *"Tidak ada kurir ideal...".

### 17. Export Laporan Insiden Harian (CSV)
**GET** `/api/incidents/export?date=YYYY-MM-DD`

Response: download CSV (`text/csv`) dengan kolom
`Kode Insiden, Waktu Lapor, Resi, Layanan, Kurir, Kurir Pengganti, Kategori,
Judul, Lokasi, Cuaca, Suhu (C), Status, Waktu Selesai, Lama Penanganan (menit)`.

Contoh:
```
GET /api/incidents/export?date=2026-10-01
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 404 | Not Found |
| 409 | Conflict (reassignment dalam 1 menit terakhir) |
| 422 | Unprocessable (validasi gagal / kurir penuh) |
| 500 | Internal Server Error |

---

## Features

### 1. Live Tracking Map
- Data kurir diambil setiap 10 detik
- Hanya kurir ONLINE dan IDLE yang ditampilkan
- Deteksi kurir "diam"

### 2. SLA Risk Panel
- Warna risiko: Merah (Kritis), Kuning (Waspada), Hijau (Aman)
- Sisa menit SLA dihitung real-time
- Data di-cache 10 detik untuk optimasi

### 3. One-Click Reassignment
- Cache lock untuk mencegah race condition
- Validasi: resi tidak bisa di-reassign dalam 1 menit terakhir -> `409`
- Validasi: kurir tujuan melebihi batas paket aktif -> `422`
- Validasi: kapasitas muatan kurir kurang -> `422`
- Validasi: armada tidak kompatibel dengan layanan -> `422`
- Validasi: paket sudah `DELIVERED` -> `422`
- Audit log otomatis dibuat
- Notifikasi async via queue (`NotifikasiPengalihan`, `afterCommit`)

### 4. Incident Management
- Upload foto bukti ke Cloudinary
- Kandidat kurir pengganti otomatis: beban paling ringan + armada kompatibel
- Eskalasi otomatis: insiden `REPORTED`
- Tracking status insiden

### 5. Audit Log & History
- Immutable audit log
- Export ke CSV, XLSX, dan PDF
- Ringkasan KPI (Total Incidents, Reassignment Rate, Avg Resolution Time,
  SLA Saved Rate)

---

## Realtime (Laravel Reverb)

Selain REST, backend menyiarkan event ke channel **`hub.{hubId}`** melalui
WebSocket (Laravel Reverb, port **8080**). Konfigurasi ada di `.env`
(`BROADCAST_CONNECTION=reverb` + `REVERB_*`) dan `config/reverb.php`.

Server WebSocket harus dijalankan terpisah:

```bash
php artisan reverb:start
```

Saat event disiarkan, payload-nya memakai bentuk snake_case seperti response
REST, dengan envelope `event` sesuai `broadcastAs()`:

| Event | Nama event | Payload `data` | Dipicu oleh |
|-------|------------|----------------|-------------|
| `IncidentReported` | `incident.reported` | `{ incident }` — sama dengan `GET /api/incidents` | `POST /api/incidents` |
| `IncidentEscalated` | `incident.escalated` | `{ incident, unacknowledged_minutes, severity }` | `incident:escalate` |
| `ReassignmentCompleted` | `incident.reassigned` | `{ incident_id, incident_code, waybill_number, original_courier, replacement_courier, confirmation_code, status }` | `POST /api/incidents/{id}/reassign` |
| `CourierTelemetryUpdated` | `courier.telemetry` | `{ courier: { id, courier_code, name, status, latitude, longitude, speed_kmh, battery_level, recorded_at } }` | `POST /api/couriers/{id}/telemetry` |

Channel memakai bentuk publik `hub.{hubId}` sehingga klien cukup menyebut UUID hub tanpa endpoint otorisasi tambahan.

Contoh langganan di frontend (`laravel-echo` + `pusher-js`):

```js
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: 8080,
    forceTLS: false,
});

echo.channel(`hub.${hubId}`)
    .listen('.incident.reported', ({ incident }) => { /* alarm + pop-up */ })
    .listen('.incident.escalated', ({ incident }) => { /* alarm ESCALATED */ })
    .listen('.incident.reassigned', ({ incident_code }) => { /* refresh panel */ })
    .listen('.courier.telemetry', ({ courier }) => { /* geser pin peta */ });
```

Semua event memakai `ShouldBroadcast` (antrean) sehingga **request REST tidak
pernah menunggu koneksi WebSocket**. `php artisan queue:listen` wajib berjalan;
bila Reverb mati, job tercatat di `failed_jobs` tanpa memengaruhi respons API.

## Queue Worker

Menjalankan notifikasi async **sekaligus** pengiriman event realtime di atas:
```bash
php artisan queue:listen
```

## Scheduled Commands

Jalankan scheduler (butuh proses terpisah, atau pasang cron):
```bash
php artisan schedule:work
```

| Command | Jadwal | Kegunaan |
|---------|--------|----------|
| `report:daily-incidents` | tiap hari 08:00 WIB | Laporan insiden harian (CSV) ke `storage/app/public/exports/` |
| `incident:escalate` | tiap menit | Insiden `REPORTED` > 10 menit -> `ESCALATED` (FRD-03 / BR-04) |

Keduanya juga bisa dipanggil manual:
```bash
php artisan report:daily-incidents --date=2026-10-01
php artisan incident:escalate --minutes=10
```

## Database

- PostgreSQL via Supabase
- UUID primary keys
- Foreign key constraints
- Index untuk optimasi query

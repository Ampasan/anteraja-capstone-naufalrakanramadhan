# Product Requirement Document (PRD) — Courier Admin Mini-Panel Anteraja (Laravel Backend Edition)

**Nama Proyek:** Courier Admin Mini-Panel Anteraja  
**Versi Dokumen:** v5.0 
**Status:** Approved for System & Software Engineering  
**Target Delivery:** 8-Week Release Plan (Phase 1 MVP: Weeks 1–4, Phase 2 Extension: Weeks 5–8)  
**Tech Stack Utama:**  
- **Backend Framework:** Laravel
- **Real-Time Broadcasting:** Laravel Reverb (Native WebSocket Server) & Redis Pub/Sub  
- **ORM & Database:** Eloquent ORM, PostgreSQL, Redis Cache  
- **Authentication & Security:** Laravel Sanctum / JWT Authentication & HTTP-Only Secure Cookies  
- **Queue & Async Processing:** Laravel Horizon, Redis Queue Workers & Scheduled Commands (Cron)  
- **Frontend Framework:** React.js, Tailwind CSS, React-Leaflet, Lucide Icons  

---

## 1. Executive Summary & Ringkasan Perubahan Tech Stack

Dokumen **Product Requirement Document (PRD)** v5.0 ini memutakhirkan spesifikasi teknis arsitektur *Courier Admin Mini-Panel Anteraja* dari fondasi Express.js/Node.js ke **Laravel**. Perubahan ini dilakukan untuk memanfaatkan ekosistem *enterprise-grade* Laravel yang sangat stabil, terstruktur, serta memiliki dukungan *built-in* untuk real-time WebSocket (*Laravel Reverb*), antrean pekerjaan async (*Laravel Horizon & Queues*), serta *database ORM* modern (*Eloquent ORM*).

Seluruh aturan bisnis, 9 jenis layanan pengiriman (*delivery services*), batasan latensi operasional, dan kriteria penerimaan (Acceptance Criteria) dari dokumen PRD/FRD sebelumnya **tetap dipertahankan 100% dan terikat penuh** pada arsitektur Laravel ini.

---

## 2. Masalah Bisnis & Root Cause Analysis

1. **Akar Masalah Teknis (Visibility Gap):** Kurir SATRIA hanya melakukan pemindaian barcode saat penjemputan dan penyerahan akhir (*checkpoint scan*). Tanpa transmisi telemetri GPS *real-time*, Admin Hub tidak memiliki visibilitas posisi aktual kurir di antara titik pemindaian pada rute jalanan Indonesia yang padat.
2. **Akar Masalah Kompleksitas Layanan (Multi-Service SLA Complexity):** Anteraja menangani **9 Jenis Layanan Pengiriman** (*Regular, Same Day, Next Day, Instant, Dokumen, Cargo, Mini Cargo, PHARMA, Frozen*) dengan karakteristik dan SLA yang sangat beragam. Tanpa panel terintegrasi, kalkulasi risiko keterlambatan dilakukan secara reaktif.
3. **Akar Masalah Proses (Manual Incident Response):** Koordinasi kendala lapangan (banjir, macet parah, ban bocor, suhu termal *Frozen* naik) masih melalui pesan instan terisolasi, menyebabkan informasi kritis terlewat atau lambat ditanggapi oleh Admin Hub.
4. **Akar Masalah Sistem (Unvalidated Task Reassignment):** Pemindahan beban paket antar-kurir dilakukan secara manual tanpa validasi kualifikasi armada (seperti paket *Cargo* tidak sengaja dialihkan ke motor, atau paket *PHARMA* dialihkan ke kurir non-sertifikasi BPOM).
5. **Dampak Utama Bisnis:** Identifikasi keterlambatan yang bersifat reaktif memicu lonjakan angka *SLA Breached*, klaim kerusakan produk sensitif (makanan beku/obat), serta pembengkakan biaya pengiriman ulang (*re-delivery*).

---

## 3. Profil Pengguna (User Persona)

* **Admin Hub Operasional (Pengguna Utama):** Petugas di Stasiun Layanan (Hub / *Staging Store*) Anteraja di tingkat kota/kecamatan (misal: Hub Tebet, Hub Kebon Jeruk, Hub Rawamangun, Hub Sunter, Hub BSD) yang memonitor puluhan kurir SATRIA dan ribuan paket harian. Membutuhkan dasbor visual *Single-Screen Control Center* berbasis web desktop untuk memantau lokasi kurir, risiko SLA, dan mengeksekusi pengalihan rute.
* **Kurir SATRIA (Armada Lapangan):** Kurir pengantaran Anteraja yang mengoperasikan moda kendaraan Motor (*Motorcycle*), Mobil (*Van*), dan Truk (*Cargo Truck*), termasuk armada berfasilitas khusus (tas termal *Frozen* atau sertifikasi BPOM *PHARMA*). Mengirimkan telemetri GPS/suhu dan melaporkan kendala via aplikasi seluler SATRIA.
* **Hub Manager / Customer Care (Viewer):** Memantau rekapitulasi audit log, eskalasi insiden, dan penyesuaian ETA paket secara *read-only*.

---

## 4. Taksonomi 9 Layanan Pengiriman Anteraja (Delivery Services)

| No | Layanan (Service) | Deskripsi & Formula SLA | Moda Armada (Vehicle) | Penanganan Khusus (Special Handling) |
|---|---|---|---|---|
| 1 | **Regular** | Pengiriman standar nasional:<br>• **1-2 hari:** Jawa & Jabodetabek<br>• **2-4 hari:** Antar-provinsi<br>• **5-9 hari:** Luar Jawa | Motor / Van | Penanganan standar logistik e-commerce. |
| 2 | **Same Day** | Kirim pagi, tiba hari ini. Batas maksimal pengantaran pukul **22.00 WIB** pada hari berjalan. | Motor | Pengiriman prioritas hari berjalan, rute teroptimasi. |
| 3 | **Next Day** | Pengiriman esok hari terencana. Tiba dalam **24 jam (H+1)** dari waktu penjemputan (*Pickup_Time*). | Motor / Van | SLA 24 jam dengan *cutoff pickup* sore hari. |
| 4 | **Instant** | Pengiriman langsung titik jemput ke penerima **tanpa transit** (via API B2B). Durasi **1-3 jam** langsung. | Motor | F&B cepat saji, obat darurat, retail multi-cabang. |
| 5 | **Dokumen** | Berkas penting, kartu nasabah perbankan, paspor, polis. Mengikuti **SLA Regular**. | Motor | *Tamper-evident security pouch* berpenomoran khusus, penerima wajib verifikasi KTP. |
| 6 | **Cargo** | Barang berat/besar skala bisnis (furnitur, elektronik, mesin). Berat **hingga 300 kg**, dimensi maks **100x100x180 cm**. SLA **1-3 hari**. | Cargo Truck / Blind Van | Wajib armada mobil/truk kargo, penanganan muatan berat (*heavy handling*). |
| 7 | **Mini Cargo** | Paket UMKM menengah dengan berat **> 4 kg s/d 40 kg**. SLA **1-3 hari** dengan biaya ekonomis. | Van / Motor Khusus | Optimalisasi muatan paket UMKM menengah. |
| 8 | **PHARMA** | Alat kesehatan, vaksin, reagen, dan obat berstandar regulasi BPOM. Penjagaan suhu tertentu (15°C–25°C). | Van / Dedicated Motor | Kurir berdedikasi khusus Pharma dengan sertifikasi SOP penanganan farmasi BPOM. |
| 9 | **Frozen** | Produk beku & sensitif suhu dingin (**-2°C hingga 5°C**). Tiba di hari yang sama (**Same Day**) maks **22.00 WIB**. | Motor / Van dengan Tas Termal / Ice Gel | Peringatan otomatis (*Cold-Chain Alert*) jika suhu di luar rentang -2°C s/d 5°C. |

---

## 5. Arsitektur Teknis Laravel Backend & Real-Time Stack

### 5.1 Arsitektur Komponen Laravel 11
```
+-----------------------------------------------------------------------------------+
|                                  REACT.JS SPA FRONTEND                            |
|             (React-Leaflet Map, SLA Table, Actionable Incident Modals)            |
+-----------------------------------------------------------------------------------+
       ^ WebSocket Connection (Pusher Protocol)         | REST API / HTTPS
       |                                                v
+-----------------------------+          +------------------------------------------+
|    LARAVEL REVERB SERVER    |          |            LARAVEL BACKEND            |
|  (Standalone WebSocket Node)|          |   (REST Controllers, Auth, Middleware)   |
+-----------------------------+          +------------------------------------------+
       ^                                                | Eloquent ORM
       | Redis Pub/Sub Broadcast                        v
+-----------------------------------------------------------------------------------+
|                        REDIS CACHE & PUB/SUB BUFFER                           |
|       (Live GPS Telemetry Buffer, Session Store, Queue Worker Antrean)             |
+-----------------------------------------------------------------------------------+
                                                        |
                                                        v
+-----------------------------------------------------------------------------------+
|                               POSTGRESQL DATABASE                              |
|           (Users, Orders, Reassignment Logs, Incident Audit Trails)               |
+-----------------------------------------------------------------------------------+
```

### 5.2 Rincian Tumpukan Teknologi Laravel Backend

1. **Laravel Reverb (Native WebSockets):**
   * Menggantikan Node.js Socket.io server. Reverb berjalan sebagai proses *standalone high-performance WebSocket server* di Laravel.
   * Mendukung protokol Pusher sehingga terintegrasi mulus dengan `laravel-echo` di sisi React.js frontend.
   * Digunakan untuk membroadcast peristiwa *real-time*: `TelemetryUpdatedEvent`, `SlaRiskStatusChangedEvent`, `IncidentReportedEvent`, dan `TaskReassignedEvent`.
2. **Laravel Horizon & Redis Queues:**
   * Mengelola pekerjaan pemrosesan di latar belakang (*asynchronous background jobs*).
   * **`ProcessTelemetryJob`:** Memproses pembaruan posisi GPS kurir dan suhu *Frozen* dari Redis buffer ke database secara *batching*.
   * **`RecalculateSlaJob`:** Dijalankan secara berkala (cron per menit) untuk memperbarui sisa SLA dinamis seluruh paket aktif.
3. **Eloquent ORM & Migrations:**
   * Mengelola skema PostgreSQL terstruktur (`users`, `orders`, `incidents`, `task_reassignments`, `user_settings`).
   * Menggunakan *Indexing* pada kolom `courier_id`, `sla_status`, `service_type`, dan `incident_status` untuk memastikan kueri < 50ms.
4. **Laravel Sanctum (Authentication & Session Security):**
   * Otentikasi berbasis *Token / HTTP-Only Cookie* terenkripsi untuk Admin Hub dan Manager.
   * Mengatur *Access Token Lifetime* (15 menit) dan *Refresh Token* (8 jam di Redis Cache).
   * Menangani *Brute-Force Rate Limiting* (maks. 5 kali gagal per 15 menit).
5. **Laravel Task Scheduling (Cron Engine):**
   * Menjalankan kueri evaluasi eskalasi kendala yang tidak ditanggapi admin > 10 menit (`incidents:check-escalations`).

---

## 6. Fitur Utas MVP & Acceptance Criteria (AC)

### 6.1 Peta Pemantauan Langsung (Live Monitoring Map)
* **Deskripsi:** Menampilkan lokasi kurir SATRIA dan titik tujuan paket (*Drop_Latitude*, *Drop_Longitude*) di wilayah Indonesia pada peta React-Leaflet dengan filter 9 layanan pengiriman dan jenis kendaraan.
* **Laravel Implementation:**
  * Endpoint Telemetri: `POST /api/v1/telemetry/push` (dikirim dari Mobile App SATRIA) atau via Reverb Direct Channel.
  * Event: `broadcast(new CourierTelemetryBroadcast($data))->toOthers();`
  * Memory Storage: Koordinat GPS terbaru disimpan di Redis Key `telemetry:courier:{id}` dengan TTL 15 detik sebelum di-commit ke database.
* **Acceptance Criteria (AC):**
  * **AC-01.1:** *Given* kurir aktif bertugas, *When* HP kurir mentransmisikan lokasi GPS, *Then* penanda (*marker*) berpindah di peta React-Leaflet dalam latensi ≤ 3.0 detik.
  * **AC-01.2:** *Given* admin memilih filter layanan ("Frozen" / "Cargo"), *When* filter diterapkan, *Then* peta hanya menampilkan penanda kurir dan paket berlayanan terkait.
  * **AC-01.3:** *Given* paket berlayanan *Frozen* mendeteksi suhu > 5.0°C, *When* data diterima Laravel, *Then* sistem membroadcast `ColdChainAlertEvent` dan penanda peta memunculkan indikator berkedip warna Oranye/Merah.
  * **AC-01.4:** *Given* kurir terputus sinyal > 15 detik, *When* terdeteksi Redis monitor, *Then* status visual penanda kurir berubah menjadi abu-abu (*Offline*).

### 6.2 Panel Indikator Risiko SLA (SLA Risk Indicator Panel)
* **Deskripsi:** Menghitung sisa waktu SLA secara dinamis berdasarkan formula spesifik 9 layanan Anteraja dan mengurutkan paket paling kritis di posisi teratas secara otomatis.
* **Laravel Implementation:**
  * Cron Job / Scheduled Task: `php artisan sla:recalculate` (berjalan per 60 detik).
  * Service Class: `App\Services\SlaCalculatorService` mengkalkulasi selisih `sla_deadline` terhadap waktu server dengan koefisien hambatan cuaca/macet (potongan 15% buffer).
  * Event: `SlaStatusUpdatedEvent` dipancarkan via Reverb jika ada paket yang berpindah status menjadi `HIGH_RISK` / `BREACHED`.
* **Acceptance Criteria (AC):**
  * **AC-02.1:** *Given* daftar paket aktif, *When* panel dimuat, *Then* paket diurutkan secara *Ascending* berdasarkan `sla_remaining_minutes`.
  * **AC-02.2:** *Given* layanan durasi pendek (*Instant*, *Same Day*, *Frozen*):
    * Sisa SLA < 15 menit: status **HIGH_RISK** (Latar Belakang Merah Flashing).
    * Sisa SLA 15–30 menit: status **MEDIUM_RISK** (Latar Belakang Kuning).
    * Sisa SLA > 30 menit: status **SAFE** (Latar Belakang Hijau).
    * Melewati batas (misal > 22:00 WIB untuk Same Day/Frozen): status **BREACHED**.
  * **AC-02.3:** *Given* layanan durasi hari (*Next Day*, *Regular*, *Dokumen*, *Cargo*, *Mini Cargo*), *When* sisa waktu mendekati *cutoff* harian (< 2 jam), *Then* status dinaikkan ke **HIGH_RISK**.
  * **AC-02.4:** *Given* admin mengklik baris paket pada tabel SLA, *When* diklik, *Then* peta melakukan *auto-zoom* ke lokasi kurir dan titik tujuan di wilayah Indonesia (< 1.0 detik).

### 6.3 Pengalihan Tugas Satu-Klik (One-Click Task Reassignment)
* **Deskripsi:** Memindahkan paket terkendala dari kurir bermasalah ke kurir pengganti yang memenuhi kualifikasi armada dan kualifikasi layanan.
* **Laravel Implementation:**
  * Endpoint: `POST /api/v1/tasks/reassign`
  * Controller & Engine: `App\Services\CompatibilityMatchingEngine` melakukan kueri Eloquent untuk menyaring kandidat kurir:
    - Status: `ONLINE` & Beban Kerja: `< 20 paket`
    - Layanan `Cargo`: `vehicle IN ('Van', 'Cargo_Truck')`
    - Layanan `Frozen`: `thermal_equipment_active = true`
    - Layanan `PHARMA`: `bpom_pharma_certified = true`
  * Database Transaction: Executed inside `DB::transaction()` to ensure atomicity across `orders` table update and `task_reassignment_logs` creation in < 2.0 seconds.
* **Acceptance Criteria (AC):**
  * **AC-03.1:** *Given* paket *Cargo* (> 40 kg / dimensi besar) perlu dialihkan, *When* modal dibuka, *Then* sistem hanya merekomendasikan kurir berarmada *Van* atau *Cargo Truck* (mendiskualifikasi motor).
  * **AC-03.2:** *Given* paket *PHARMA* atau *Frozen* perlu dialihkan, *When* modal diklik, *Then* sistem hanya merekomendasikan kurir dengan sertifikasi BPOM atau tas termal aktif.
  * **AC-03.3:** *Given* kurir pengganti dipilih dan dikonfirmasi, *When* tombol diklik, *Then* transaksi Eloquent & Redis selesai < 2.0 detik, dan rute baru terdorong ke HP kurir dalam total waktu < 30 detik.

### 6.4 Pelapor Kendala Cepat (Quick Incident Reporting)
* **Deskripsi:** Menangkap sinyal kendala fisik lapangan kurir dari aplikasi seluler SATRIA dan memunculkan *Actionable Alert Pop-Up* di dasbor admin.
* **Laravel Implementation:**
  * Endpoint: `POST /api/v1/incidents/report`
  * Event: `broadcast(new ActionableIncidentReportedEvent($incident))->toOthers();`
  * Escalation Scheduled Job: `php artisan incidents:escalate-unhandled` (memeriksa insiden status `REPORTED` > 10 menit untuk diubah menjadi `ESCALATED`).
* **Acceptance Criteria (AC):**
  * **AC-04.1:** *Given* kurir mengirim sinyal kendala (banjir, macet, ban bocor, suhu naik) dalam maks 3 ketukan di ponsel, *Then* notifikasi *Actionable Alert* muncul di layar Admin Hub dalam durasi ≤ 5.0 detik.
  * **AC-04.2:** *Given* notifikasi kendala muncul di dasbor, *When* admin mengklik "Pengalihan Rute Instan" atau "Tambah Buffer SLA (+15m)", *Then* status insiden otomatis berubah menjadi `RESOLVED`.
  * **AC-04.3:** *Given* laporan kendala diabaikan admin > 10 menit, *When* waktu terlampaui, *Then* sistem memicu alarm eskalasi berkedip merah dan mencatat log darurat ke Hub Manager.

---

## 7. Batasan & Kebutuhan Non-Fungsional (NFR)

1. **Latensi Telemetri GPS:** Maksimal **3.0 detik** dari transmisi ponsel kurir hingga dirender pada peta React-Leaflet via Laravel Reverb.
2. **Latensi Notifikasi SLA & Insiden:** Maksimal **5.0 detik** dari pemicu server hingga diterima dasbor admin.
3. **Waktu Transaksi Database:** Proses *Task Reassignment* pada PostgreSQL via Eloquent ORM & Redis Cache wajib selesai dalam **< 2.0 detik**.
4. **Ketersediaan Sistem (Uptime):** **99.9%** pada jendela operasional 06:00 – 22:00 WIB.
5. **Waktu Muat Antarmuka (UI Load Time):** **< 1.5 detik** untuk pemuatan awal dasbor *Single-Screen Control Center*.
6. **Kapasitas Beban (Concurrency):** Mampu menangani hingga 500 koneksi WebSocket simultan per Reverb instance tanpa degradasi performa.

---

## 8. Skema Data PostgreSQL (Laravel Migrations & Eloquent Models)

### 8.1 Tabel `users`
- `id` (UUID Primary Key)
- `nik` (String, Unique - Format: `ADM-XXXXX` / `STR-XXXXX`)
- `name` (String)
- `email` (String, Unique)
- `password` (String - Hashed via Bcrypt/Argon2id)
- `role` (Enum: `admin_hub`, `courier_satria`, `hub_manager`, `customer_care`)
- `hub_id` (String - Foreign key ke identitas Hub, misal: `HUB-JAKSEL-TEBET`)
- `vehicle_type` (Enum: `motorcycle`, `van`, `cargo_truck`, `none`)
- `thermal_equipment_active` (Boolean - Default: false)
- `bpom_pharma_certified` (Boolean - Default: false)
- `active_package_count` (Integer - Default: 0)
- `status` (Enum: `ONLINE`, `OFFLINE`, `IDLE`, `OFF_DUTY`)
- `timestamps` & `soft_deletes`

### 8.2 Tabel `orders` (Refleksi `delivery.csv`)
- `id` (UUID Primary Key)
- `order_id` (String, Unique - Nomor Resi, Format: `1000XXXXXXXXXX`)
- `service_type` (Enum: `Regular`, `Same Day`, `Next Day`, `Instant`, `Dokumen`, `Cargo`, `Mini Cargo`, `PHARMA`, `Frozen`)
- `courier_id` (UUID Foreign Key ke `users`)
- `hub_origin` (String)
- `store_latitude` & `store_longitude` (Decimal 10,7)
- `destination_address` & `destination_city` (Text)
- `drop_latitude` & `drop_longitude` (Decimal 10,7)
- `courier_live_lat` & `courier_live_long` (Decimal 10,7)
- `weight_kg` (Decimal 8,2)
- `special_handling` (String)
- `temperature_c` (Decimal 4,1, Nullable)
- `weather` (Enum: `Cerah`, `Berawan`, `Gerimis`, `Hujan Deras`, `Banjir`)
- `traffic` (Enum: `Lancar`, `Sedang`, `Padat`, `Macet Total`)
- `delivery_status` (Enum: `Assigned`, `In_Transit`, `Delivered`, `Incident_Reported`)
- `pickup_time` (Timestamp)
- `sla_deadline` (Timestamp)
- `sla_remaining_minutes` (Integer)
- `sla_status` (Enum: `SAFE`, `MEDIUM_RISK`, `HIGH_RISK`, `BREACHED`)
- `timestamps`

### 8.3 Tabel `incidents`
- `id` (UUID Primary Key)
- `incident_id` (String, Unique - Format: `INC-YYYYMMDD-XXX`)
- `order_id` (UUID Foreign Key ke `orders`)
- `courier_id` (UUID Foreign Key ke `users`)
- `incident_category` (Enum: `Banjir`, `Hujan_Deras`, `Macet_Total`, `Ban_Bocor`, `Kendaraan_Mogok`, `Alamat_Tidak_Ditemukan`, `Anomali_Suhu_Dingin`, `Segel_Dokumen_Rusak`, `Kargo_Overload`)
- `incident_status` (Enum: `REPORTED`, `ACKNOWLEDGED`, `RESOLVED`, `ESCALATED`)
- `resolution_action` (Enum: `REASSIGNED`, `SLA_BUFFER_ADDED`, `DISMISSED`, Nullable)
- `handled_by_admin_id` (UUID Foreign Key ke `users`, Nullable)
- `timestamps`

### 8.4 Tabel `task_reassignments`
- `id` (UUID Primary Key)
- `order_id` (UUID Foreign Key ke `orders`)
- `original_courier_id` (UUID Foreign Key ke `users`)
- `new_courier_id` (UUID Foreign Key ke `users`)
- `assigned_by_admin_id` (UUID Foreign Key ke `users`)
- `reassignment_reason` (Text)
- `execution_duration_ms` (Integer)
- `created_at` (Timestamp)

---

## 9. Peta Jalan Pelaksanaan Laravel (8-Week Roadmap)

```
+-----------------------------------------------------------------------------------+
| MINGGU 1 - 2: PONDASI LARAVEL & DATABASE SCHEMA                                  |
| • Setup Laravel, PostgreSQL Migration, Eloquent Models & Drizzle/CSV Seeder    |
| • Implementation Laravel Sanctum Auth (Login ADM/STR, JWT & Session Redis)        |
| • Setup React.js SPA + Tailwind CSS Layout Skeleton                              |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
| MINGGU 3 - 4: LARAVEL REVERB REAL-TIME & PETA INTERAKTIF                          |
| • Konfigurasi Standalone Laravel Reverb WebSocket Server                          |
| • Integrasi React-Leaflet Map, Telemetry Broadcast Event & Redis Cache Buffer     |
| • SlaCalculatorService Engine & Scheduled Task Cron per Menit                    |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
| MINGGU 5 - 6: FITUR PENGALIHAN TUGAS & INSIDEN                                    |
| • CompatibilityMatchingEngine (Eloquent Query Filtering per Service_Type)         |
| • One-Click Reassignment API Transaction & Actionable Incident Alert Broadcast    |
| • Escalation Job Scheduler (>10 menit unhandled alerts)                           |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
| MINGGU 7 - 8: TESTING, OPTIMASI, & DEPLOYMENT                                     |
| • Performance Testing (Reverb WebSocket Load & Redis Caching)                    |
| • Integration Test dengan Data Dummy delivery.csv (100% AC Coverage)               |
| • Final UI/UX Polish, Design System Verification, & Production Release            |
+-----------------------------------------------------------------------------------+
```

---

## 10. Kesimpulan & Rekomendasi Teknis

Pengalihan *backend* ke **Laravel** memberikan fondasi rekayasa perangkat lunak (*software engineering*) yang sangat kokoh untuk proyek *Courier Admin Mini-Panel Anteraja*. Kombinasi **Laravel Reverb** untuk *real-time broadcasting*, **Eloquent ORM** untuk pengelolaan database terstruktur, dan **Laravel Horizon** untuk antrean pekerjaan *async* memastikan sistem dapat menangani 9 jenis layanan pengiriman secara presisi dengan latensi < 3 detik.

Dokumen PRD ini menjadi acuan resmi pengembangan *backend* Laravel dan terhubung langsung dengan seluruh dokumen FRD (`FRD-00` s.d. `FRD-06`) di repositori proyek.

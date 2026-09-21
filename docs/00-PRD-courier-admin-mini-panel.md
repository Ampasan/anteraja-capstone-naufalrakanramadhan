# Product Requirement Document (PRD)
## Courier Admin Mini-Panel Anteraja (Laravel Backend Edition)

---

### 1. Masalah
* **Apa yang bermasalah sekarang?**
  * **Ketiadaan Visibilitas Posisi Kurir (Visibility Gap):** Kurir SATRIA hanya melakukan pemindaian barcode saat penjemputan dan penyerahan akhir (*checkpoint scan*). Admin Hub tidak memiliki visibilitas lokasi aktual kurir di antara titik pemindaian.
  * **Kompleksitas SLA 9 Jenis Layanan Pengiriman:** Anteraja mengelola 9 jenis layanan (*Regular, Same Day, Next Day, Instant, Dokumen, Cargo, Mini Cargo, PHARMA, Frozen*) dengan batas SLA dan instruksi penanganan fisik yang beragam. Tanpa panel terpadu, identifikasi keterlambatan dilakukan secara reaktif di akhir *shift*.
  * **Koordinasi Kendala Manual & Terisolasi:** Pelaporan hambatan lapangan (banjir, macet, kendaraan mogok, anomali suhu dingin) dilakukan via grup *chat* instan terisolasi, sehingga informasi sering terlewat atau lambat ditanggapi.
  * **Pengalihan Tugas Tanpa Validasi Kualifikasi:** Pemindahan beban paket antar-kurir dilakukan manual tanpa pengecekan kualifikasi armada (misal: paket *Cargo* dialihkan ke motor, atau paket *PHARMA* dialihkan ke kurir non-sertifikasi BPOM).
* **Data Lapangan (`delivery.txt` & Operasional Hub):**
  * Data pengiriman aktual pada `delivery.txt` menunjukkan keberagaman status kritis di lapangan, seperti paket resi `100024000104` (*Regular*) berstatus **`BREACHED`** dengan sisa SLA **-30 menit** akibat hujan deras dan macet total; paket resi `100024000102` (*Same Day*) berstatus **`HIGH_RISK`** dengan sisa SLA **15 menit**; serta paket resi `100024000107` (*Frozen*) berstatus **`CRITICAL`** dengan sisa SLA **60 menit** di tengah kondisi banjir.

---

### 2. Pengguna
* **Admin Hub Operasional (Pengguna Utama):**
  * **Jumlah:** **~100–300 pengguna** (~5–15 petugas per Stasiun Layanan/Hub di area seperti Tebet, Kebon Jeruk, Rawamangun, Sunter, BSD).
  * **Peran:** Mengawasi pergerakan puluhan kurir SATRIA dan ribuan paket harian dari dasbor *Single-Screen Control Center*, memitigasi risiko SLA, serta mengeksekusi pengalihan rute.
* **Kurir SATRIA (Armada Lapangan):**
  * **Jumlah:** **~1.000–3.000 kurir** (~20–50 kurir per Hub).
  * **Peran:** Mengoperasikan kendaraan (Motor, Van, Cargo Truck), mentransmisikan telemetri GPS/suhu, dan melaporkan kendala fisik via aplikasi seluler SATRIA.
* **Hub Manager & Customer Care (Viewer / Supervisor):**
  * **Jumlah:** **~50–100 pengguna**.
  * **Peran:** Memantau rekapitulasi audit log, eskalasi insiden, dan penyesuaian ETA paket secara *read-only*.

---

### 3. Tujuan
* **Berhasil itu kalau apa? (Angka KPI & Cara Ukur):**
  1. **Tingkat Kepatuhan SLA:** Target **≥ 97.5%** *(Diukur dari rasio paket sukses terkirim tepat waktu pada laporan SLA harian)*.
  2. **Durasi Penugasan Ulang (Task Reassignment):** Target **< 30 detik** per rute *(Diukur dari stempel waktu klik tombol pengalihan oleh Admin Hub hingga push notification rute baru diterima kurir B)*.
  3. **Tingkat Pengiriman Ulang (Re-delivery Rate):** Target **< 2.0%** *(Diukur dari persentase kegagalan penyerahan paket akibat keterlambatan atau kendala tak terkelola)*.
  4. **Volume Pesan Chat Manual:** Target **< 25 pesan/hari** per Hub *(Diukur dari penurunan frekuensi koordinasi manual via grup WhatsApp/Telegram)*.
  5. **Akselerasi Respon Kendala Lapangan:** Mempercepat penanganan kendala hingga **75%** *(Diukur dari stempel waktu pembuatan laporan kendala di aplikasi kurir hingga status berubah menjadi RESOLVED)*.

---

### 4. Lingkup

#### A. Termasuk (In-Scope MVP Core):
1. **Live Monitoring Map (Peta Pemantauan Langsung - F-01):** Peta interaktif React-Leaflet pemantau telemetri GPS kurir, posisi *drop point*, dan indikator suhu layanan *Frozen* (-2°C s/d 5°C) dengan filter 9 layanan.
2. **SLA Risk Indicator Panel (F-02):** Panel tabel yang mengurutkan paket aktif secara *ascending* berdasarkan sisa waktu SLA terdekat, dilengkapi pengkodean warna dinamis (*Safe/Green, Medium Risk/Yellow, High Risk/Red, Breached*) dan *cross-highlighting* ke peta.
3. **One-Click Task Reassignment (F-03):** Engine pengalihan tugas 1-klik dengan validasi otomatis kualifikasi armada/layanan (*Cargo* wajib van/truck, *Frozen* wajib tas termal, *PHARMA* wajib sertifikasi BPOM, beban aktif < 20 paket).
4. **Quick Incident Reporting (F-04):** Fitur pelaporan kendala 3-tap dari aplikasi mobile kurir yang memicu *actionable alert pop-up* di dasbor admin serta mekanisme eskalasi otomatis jika diabaikan > 10 menit.
5. **Dashboard Single-Screen Control Center:** Antarmuka web desktop terpadu untuk Admin Hub.

#### B. Tidak Termasuk / Luar Scope MVP (Out-of-Scope):
1. **User Profile, Settings, & Preference Page (F-06):** Pengaturan profil avatar, ganti kata sandi, dan preferensi tema/notifikasi dikeluarkan dari lingkup MVP. Identitas admin di-hardcode menggunakan *Mock Session* ("Siti - Admin Hub Tebet").
2. **Otomatisasi Pengalihan Rute Berbasis AI/ML Mandiri:** Pengalihan tugas wajib dikonfirmasi manual oleh Admin Hub, tidak dialihkan otomatis oleh algoritma kecerdasan buatan.
3. **Pengembangan Ulang Aplikasi Mobile Kurir dari Nol:** Hanya menyediakan integrasi API/WebSocket pada aplikasi SATRIA yang sudah ada.
4. **Antarmuka Pelacakan Publik Pembeli/Konsumen:** Peta pemantauan khusus internal Admin Hub dan tidak diakses konsumen e-commerce.
5. **Mesin Notifikasi Otomatis WhatsApp/SMS ke Konsumen:** Sistem tidak mengirimkan pesan keterlambatan langsung ke nomor seluler pelanggan.
6. **Integrasi Panggilan Darurat Pihak Ketiga:** Tidak terhubung langsung ke layanan kepolisian, ambulans, atau bengkel eksternal.
7. **Kalkulasi Insentif / Bonus Keuangan:** Tidak mengkalkulasi skema pembagian komisi atau penalti akibat pemindahan beban tugas.

---

### 5. Batasan
* **Tumpukan Teknologi (Tech Stack Wajib):**
  * **Backend Framework:** Laravel 11 (PHP 8.3).
  * **Real-Time Broadcasting:** Laravel Reverb (Standalone WebSocket) & Redis Pub/Sub.
  * **Database & ORM:** PostgreSQL & Eloquent ORM.
  * **Caching & Queue Worker:** Redis Cache & Laravel Horizon.
  * **Frontend Framework:** React.js, Tailwind CSS, React-Leaflet.
* **Batasan Kinerja & Latensi Teknis:**
  * **Latensi Telemetri GPS:** Maksimal **3.0 detik** dari HP kurir hingga *marker* berpindah di peta admin.
  * **Latensi Respon Alert SLA / Kendala:** Maksimal **5.0 detik** dari pemicu hingga *pop-up alert* muncul di dasbor.
  * **Durasi Transaksi Database Pengalihan:** Selesai dalam **< 2.0 detik** di dalam `DB::transaction()`.
  * **Waktu Muat Antarmuka (UI Load):** **< 1.5 detik**.
  * **Ketersediaan Sistem (Uptime):** **99.9%** pada jam operasional utama (06:00 – 22:00 WIB).

---

### 6. Skala
1. **Berapa pengguna, kapan paling ramai?**
   * Total **~3.150–3.400 pengguna aktif** (300 Admin Hub, 3.000 Kurir SATRIA, 50 Manager/CC).
   * **Jam Teramai (Peak Hours):** Pukul **10:00 – 17:00 WIB** (puncak proses *pickup*, pemindaian hub, dan pengantaran *Same Day / Instant / Frozen*).
2. **Berapa data per tahun, disimpan berapa lama?**
   * **~50–100 juta record** log telemetri GPS dan transisi status per tahun.
   * Data aktif disimpan di database PostgreSQL selama **1 tahun**, data *cache* telemetri di Redis dengan TTL 15 detik, dan arsip *audit log* disimpan selama **2 tahun**.
3. **Nunggu berapa lama masih wajar?**
   * Pembaruan peta GPS: **≤ 3.0 detik**.
   * Kemunculan *actionable alert* kendala: **≤ 5.0 detik**.
   * Pemuatan ulang dasbor UI: **< 1.5 detik**.
4. **File segede apa?**
   * *Payload JSON* telemetri/alert: **1–2 KB** per transmisi WebSocket.
   * Lampiran foto bukti kendala fisik (jika ada): Maksimal **2–5 MB** per unggahan.
5. **Pakai sistem lain apa? Kalau mati?**
   * Terhubung ke Aplikasi Seluler SATRIA (Kirim GPS/Kendala) dan API Customer Care System (Sinkronisasi ETA).
   * **Mitigasi Jika Mati/Koneksi Terputus:** Perangkat seluler kurir menerapkan *Local Buffering* pada memori lokal HP untuk menyimpan koordinat GPS terpending, lalu melakukan *batch upload* saat koneksi pulih. Jika terputus > 15 detik, penanda kurir di peta otomatis berubah warna menjadi **Abu-abu (Offline)**.
6. **Kalau aplikasi mati 1 jam, separah apa?**
   * **Sangat Parah:** Terjadi "kebutaan operasional" di 100+ Hub. Risiko *SLA Breached* melonjak tajam pada layanan durasi pendek (*Instant, Same Day, Frozen*), potensi kerusakan produk sensitif suhu (daging beku/obat) akibat gagal mitigasi, penumpukan paket di hub, serta pembengkakan biaya *re-delivery*.

---

### 7. Daftar Fitur (Core MVP)

| ID Fitur | Nama Fitur | Prioritas | Ringkasan Acceptance Criteria (AC) |
| :--- | :--- | :---: | :--- |
| **F-01** | **Live Monitoring Map** | **P0 (High)** | **AC:** Marker kurir berpindah di peta React-Leaflet ≤ 3.0s setelah GPS dikirim; filter 9 layanan berfungsi; alert visual muncul jika suhu *Frozen* di luar -2°C s/d 5°C; marker berubah abu-abu jika offline > 15s. *(Merujuk pada FRD-01)* |
| **F-02** | **SLA Risk Indicator Panel** | **P0 (High)** | **AC:** Pengurutkan tabel paket secara *ascending* sisa SLA; penandaan warna otomatis (Merah <15m, Kuning 15–30m, Hijau >30m); klik baris tabel memicu *auto-zoom* ke peta < 1.0s. *(Merujuk pada FRD-02)* |
| **F-03** | **One-Click Task Reassignment** | **P1 (Med-High)** | **AC:** Engine menyaring kandidat kurir berstatus ONLINE, beban < 20 paket, serta kualifikasi armada/layanan (*Cargo*->Van, *Frozen*->Tas Termal, *PHARMA*->BPOM); eksekusi DB < 2.0s; total alur < 30s. *(Merujuk pada FRD-03)* |
| **F-04** | **Quick Incident Reporting** | **P1 (Med-High)** | **AC:** Pelaporan kendala di HP kurir max 3 taps; *actionable alert pop-up* muncul di admin ≤ 5.0s; eskalasi otomatis berkedip merah jika diabaikan > 10m. *(Merujuk pada FRD-04)* |

---

### 8. Keputusan Terbuka

| No | Pertanyaan Keputusan Terbuka | Pihak Pengambil Keputusan | Batas Waktu (*Deadline*) |
| :---: | :--- | :--- | :---: |
| 1 | Apakah opsi *Override Force Assign* (pengalihan paksa ke kurir beban > 20 paket saat darurat) boleh dieksekusi langsung oleh Admin Hub tanpa persetujuan Hub Manager? | **Operations Manager Anteraja** | Minggu 2 |
| 2 | Berapa durasi ideal penyimpanan sementara (*TTL buffer*) telemetri GPS kurir di Redis sebelum di-commit secara *batching* ke PostgreSQL? | **IT Infrastructure & Lead Database Architect** | Minggu 3 |
| 3 | Apakah ambang batas toleransi suhu dingin pada layanan *Frozen* (-2°C s/d 5°C) perlu pembedaan alarm khusus untuk komoditas es krim (-18°C) vs daging segar (0°C)? | **Quality Assurance & Cold-Chain Logistics Lead** | Minggu 4 |

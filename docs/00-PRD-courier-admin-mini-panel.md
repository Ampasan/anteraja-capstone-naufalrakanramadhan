# Product Requirement Document (PRD) — Courier Admin Mini-Panel

**Project Name:** Courier Admin Mini-Panel Anteraja  
**Document Version:** v3.0 (Industrial Standard — 1-Page Summary)  
**Status:** Approved for MVP Engineering  
**Target Delivery:** 8-Week Release Plan (Phase 1 MVP: Weeks 1–4)  
**Tech Stack:** React.js, Tailwind CSS, Express.js (Node.js), PostgreSQL, Drizzle ORM, Socket.io, Redis Cache [10]

---

### 1. Masalah (Apa yang bermasalah sekarang?)
* **Akar Masalah Teknis:** Kurir (SATRIA) hanya memperbarui status saat pemindaian titik tiba/selesai, sehingga Admin Hub tidak memiliki visibilitas lokasi aktual kurir secara *real-time* di antara titik pemindaian [6].
* **Akar Masalah Proses:** Koordinasi hambatan di lapangan masih menggunakan grup pesan instan yang terisolasi, menyebabkan informasi kendala sering terlewat atau lambat ditanggapi [6, 7].
* **Akar Masalah Sistem:** Data paket, status kurir, dan peta wilayah terpisah di beberapa aplikasi berbeda, sehingga admin butuh waktu lama untuk mencocokkan data sebelum memindahkan beban kerja [7].
* **Dampak Utama Bisnis:** Identifikasi paket berisiko keterlambatan dilakukan secara reaktif di akhir *shift*, yang meningkatkan angka *SLA Breached* serta membengkakkan biaya pengiriman ulang (*re-delivery*) [3, 7].

---

### 2. Pengguna (Siapa yang pakai, ada berapa?)
* **Admin Hub Operasional (Pengguna Utama):** Pengatur lalu lintas operasional harian di Stasiun Layanan (Hub) yang menghubungkan sistem alokasi paket pusat, kurir SATRIA, dan *Customer Service* [3]. Membutuhkan dasbor visual satu layar tanpa navigasi berlapis untuk mengeliminasi beban tab berlebih dan administrasi manual [4].
* **Kurir SATRIA (Sumber Data Lapangan):** Kurir lapangan yang membawa paket menggunakan kendaraan (motor, scooter, van) dan membutuhkan pelaporan kendala ringkas dari aplikasi seluler agar terrefleksikan secara instan pada layar admin hub [4, 5].

---

### 3. Tujuan (Berhasil itu kalau apa?)
* **Target Kepatuhan SLA (*SLA Compliance*):** Mencapai tingkat kepatuhan penyerahan paket sebesar **97.5%** (menekan *SLA Breached* **< 2.5%**) [2, 14].
* **Kecepatan Penanganan Kendala:** Mempercepat respon penanganan hambatan lapangan hingga **75%** [2].
* **Durasi Penugasan Ulang (*Task Reassignment*):** Memangkas waktu pengalihan beban paket menjadi **< 30 detik** per rute [14].
* **Efisiensi Biaya Operasional:** Menekan tingkat pengiriman ulang (*re-delivery rate*) hingga **< 2.0%** [14].
* **Efisiensi Komunikasi:** Menekan koordinasi pesan manual menjadi **< 25 pesan/hari** [14].

---

### 4. Lingkup (Apa yang dibuat, apa yang nggak?)
* **Di Dalam Scope MVP (In-Scope):**
  * **Aplikasi Web Internal:** Dasbor *Courier Admin Mini-Panel* berbasis web interaktif satu layar [2, 4].
  * **Fitur Utama MVP:**
    1. *Live Monitoring Map* [9]
    2. *SLA Risk Indicator Panel* [9, 10]
    3. *One-Click Task Reassignment* [10]
    4. *Quick Incident Reporting* [12]
* **Di Luar Scope MVP (Out-of-Scope / Luar Scope MVP):**
  * Otomatisasi pengalihan rute berbasis *AI / Machine Learning* tanpa konfirmasi manual admin.
  * Pembuatan aplikasi seluler kurir baru dari awal (sistem memanfaatkan aplikasi seluler SATRIA / API yang ada).
  * Pengiriman notifikasi SMS/WhatsApp otomatis langsung ke penerima/pembeli paket *e-commerce*.

---

### 5. Batasan (Apa yang wajib dipakai atau dipenuhi?)
* **Tumpukan Teknologi (*Tech Stack*):** React.js, Tailwind CSS, Express.js (Node.js), PostgreSQL, Drizzle ORM, Socket.io, dan Redis Cache [10].
* **Batasan Kinerja Teknis (NFR / SLA Teknis):**
  * **Latensi Telemetri GPS:** Maksimal **3 detik** [12].
  * **Respon Peringatan SLA:** Maksimal **5 detik** [12].
  * **Ketersediaan Sistem (*Uptime*):** **99.9%** pada jam operasional (06:00 – 22:00 WIB) [13].
  * **Waktu Muat Antarmuka (*UI Load*):** **< 1.5 detik** [13].

---

### 6. Skala (Seberapa besar dan seberapa penting?)
* **Tingkat Kepentingan:** **Sangat Kritis (*High Priority / P0*)**, karena kegagalan menjaga tingkat layanan di tingkat hub merusak reputasi merek Anteraja di mata mitra *e-commerce* dan membengkakkan biaya *re-delivery* [3].
* **Skala Operasional:** Aplikasi internal tingkat Hub (Stasiun Layanan) untuk mengelola lalu lintas operasional harian, sebaran puluhan kurir SATRIA, dan aliran ribuan paket di area terkait [3].

---

### 7. Daftar Fitur & Acceptance Criteria (Kriteria Penerimaan)

#### Prioritas 1 (P0 - MVP Core / Tahap 1: Minggu 1–4)

1. **Peta Pemantauan Langsung (*Live Monitoring Map*)**
   * **Deskripsi:** Menampilkan posisi lokasi aktual kurir dan penanda lokasi tujuan pengiriman paket (`Drop_Latitude`, `Drop_Longitude`) pada peta interaktif [9, 17].
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-01.1:** *Given* kurir aktif bertugas, *When* perangkat mengirimkan sinyal GPS via Socket.io, *Then* marker kurir di peta berpindah dengan latensi ≤ 3 detik [12].
     * **AC-01.2:** *Given* admin mengklik marker kurir/paket, *When* diklik, *Then* muncul *popup window* berisi `Order_ID`, status ketersediaan, dan detail lokasi [17].
     * **AC-01.3:** *Given* sinyal GPS kurir terputus > 15 detik, *When* terdeteksi sistem, *Then* ikon kurir berubah menjadi warna abu-abu (*offline*) [13].

2. **Panel Indikator Risiko SLA (*SLA Risk Indicator Panel*)**
   * **Deskripsi:** Mengurutkan daftar paket secara otomatis berdasarkan sisa waktu SLA terdekat dengan indikator warna visual [10].
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-02.1:** *Given* daftar paket aktif di hub, *When* panel dimuat, *Then* daftar diurutkan otomatis secara *Ascending* berdasarkan sisa waktu SLA [10].
     * **AC-02.2:** *Given* sisa waktu SLA < 15 menit, *When* dihitung sistem, *Then* baris paket diberi warna **Merah** (*High Risk / Breached*).
     * **AC-02.3:** *Given* sisa waktu SLA 15–30 menit diberi warna **Kuning**, dan > 30 menit diberi warna **Hijau**.
     * **AC-02.4:** *Given* admin mengklik satu paket di panel SLA, *When* diklik, *Then* peta melakukan *auto-zoom* dan menyorot titik `Drop_Latitude` & `Drop_Longitude` [17].

---

#### Prioritas 2 (P1 - MVP Extension / Tahap 2: Minggu 5–8)

3. **Pengalihan Tugas Satu-Klik (*One-Click Task Reassignment*)**
   * **Deskripsi:** Memindahkan beban pengiriman paket dari kurir terkendala ke kurir lain yang tersedia [10].
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-03.1:** *Given* Kurir A terkendala, *When* admin memilih paket dan mengklik "Pengalihan Rute" ke Kurir B, *Then* status tugas berpindah dalam durasi < 30 detik [14].
     * **AC-03.2:** *Given* pengalihan sukses, *When* data diperbarui, *Then* rute baru terkirim ke Kurir B dan estimasi waktu tiba (*ETA*) terbarui otomatis di sistem *Customer Care* [11].

4. **Pelapor Kendala Cepat (*Quick Incident Reporting*)**
   * **Deskripsi:** Menampilkan sinyal kendala fisik lapangan (`Weather`, `Traffic`, kendaraan mogok) dari aplikasi kurir sebagai notifikasi aksi instan [12, 17].
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-04.1:** *Given* kurir mengirim sinyal kendala dari aplikasi seluler, *When* terkirim, *Then* notifikasi *pop-up* aksi langsung muncul di layar Admin Hub dalam durasi < 5 detik tanpa perlu *reload* halaman [12].

---

### 8. Keputusan Terbuka (Open Decisions)
* **Open Decision 1 (GIS Engine):** Pemilihan antara *library* peta *open-source* (`Leaflet.js` / OpenStreetMap — ramah pemula & gratis) atau API komersial (`Mapbox` / Google Maps).
* **Open Decision 2 (Data Telemetri Testing):** Penggunaan skrip simulator telemetri GPS (*mock telemetry generator*) untuk pengujian lokal vs integrasi API *staging* aplikasi SATRIA secara langsung.
* **Open Decision 3 (Bobot SLA Dinamis):** Formulasi penyesuaian durasi SLA berdasarkan faktor cuaca (`Weather` seperti *Stormy*, *Fog*) dan kondisi lalu lintas (`Traffic` seperti *Jam*, *High*) dari dataset `data.txt` [17].

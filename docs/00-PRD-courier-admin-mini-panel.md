# Product Requirement Document (PRD) — Courier Admin Mini-Panel

**Project Name:** Courier Admin Mini-Panel Anteraja  
**Document Version:** v4.0
**Status:** Approved for MVP Engineering  
**Target Delivery:** 8-Week Release Plan (Phase 1 MVP: Weeks 1–4, Phase 2 Extension: Weeks 5–8)  
**Tech Stack:** React.js, Tailwind CSS, Express.js (Node.js), PostgreSQL, Drizzle ORM, Socket.io, Redis Cache  

---

### 1. Masalah (Problem Statement)
* **Akar Masalah Teknis:** Kurir (SATRIA) hanya memperbarui status saat pemindaian tiba/selesai (*checkpoint scan*), sehingga Admin Hub tidak memiliki visibilitas lokasi aktual kurir secara *real-time* di antara titik pemindaian di wilayah jalanan Indonesia yang padat.
* **Akar Masalah Kompleksitas Layanan:** Anteraja melayani **9 jenis layanan pengiriman** dengan karakteristik, batas SLA, dan kebutuhan penanganan yang sangat beragam (mulai dari *Instant* dalam hitungan jam hingga *Regular* antarpulau, serta produk sensitif suhu *Frozen* & regulasi ketat *PHARMA*). Tanpa panel terintegrasi, admin kesulitan mendeteksi risiko keterlambatan per jenis layanan secara dinamis.
* **Akar Masalah Proses:** Koordinasi hambatan lapangan (banjir, macet parah, ban bocor, suhu termal naik) masih menggunakan grup percakapan manual yang terisolasi, menyebabkan informasi kritis terlewat atau terlambat ditindaklanjuti.
* **Akar Masalah Sistem:** Pemindahan tugas (*reassignment*) paket terkendala masih dilakukan manual tanpa validasi kompatibilitas armada (misal: paket *Cargo* tidak sengaja dialihkan ke motor, atau paket *PHARMA* dialihkan ke kurir non-sertifikasi BPOM).
* **Dampak Utama Bisnis:** Identifikasi keterlambatan yang bersifat reaktif memicu lonjakan angka *SLA Breached*, klaim kerusakan barang sensitif (makanan beku/obat), dan pembengkakan biaya pengiriman ulang (*re-delivery*).

---

### 2. Pengguna (User Persona)
* **Admin Hub Operasional (Pengguna Utama):** Petugas di Stasiun Layanan (Hub / *Staging Store*) Anteraja di Indonesia (misal: Hub Tebet, Hub Kebon Jeruk, Hub Rawamangun, Hub Sunter, Hub BSD, Hub Harapan Indah) yang memonitor puluhan kurir SATRIA dan ribuan paket harian. Membutuhkan dasbor visual satu layar untuk memantau status kurir, risiko SLA per layanan, dan mengeksekusi aksi cepat.
* **Kurir SATRIA (Armada Lapangan):** Kurir lapangan Anteraja yang mengoperasikan moda kendaraan Motor (*Motorcycle*), Mobil (*Van*), dan Truk (*Cargo Truck*), termasuk armada dengan kualifikasi khusus (tas termal *Frozen* atau sertifikasi kurir *PHARMA*). Mengirimkan telemetri GPS berkala dan melaporkan kendala via aplikasi seluler SATRIA.

---

### 3. Taksonomi 9 Layanan Pengiriman Anteraja (Delivery Services)

| No | Layanan (Service) | Deskripsi & SLA | Moda Armada (Vehicle) | Penanganan Khusus (Special Handling) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Regular** | Pengiriman terpercaya ke seluruh Indonesia:<br>• **1-2 hari:** Jabodetabek & Pulau Jawa<br>• **2-4 hari:** Antar provinsi<br>• **5-9 hari:** Seluruh Indonesia | Motor / Van | Penanganan standar logistik e-commerce. |
| 2 | **Same Day** | Kirim pagi, paket tiba hari ini. Batas maksimal pengantaran pukul **22.00 WIB** pada hari paket diterima SATRIA. | Motor | Pengiriman prioritas hari berjalan, rute terjadwal. |
| 3 | **Next Day** | Solusi pengiriman esok hari terencana. Paket diterima dalam waktu **24 jam (H+1)** setelah diterima SATRIA. | Motor / Van | SLA 24 jam dengan cutoff pickup sore hari. |
| 4 | **Instant** | Pengiriman tercepat langsung titik jemput ke penerima **tanpa transit** (tersedia via API B2B). Durasi **1-3 jam** langsung. | Motor | Cocok untuk F&B cepat saji, obat darurat, dan toko retail multi-cabang. |
| 5 | **Dokumen** | Penanganan khusus pengiriman kartu nasabah perbankan, surat berharga, polis, bukti pembayaran, paspor. Mengikuti **SLA Regular**. | Motor | *Tamper-evident security pouch* berpenomoran khusus, tanda terima wajib KTP/identitas. |
| 6 | **Cargo** | Distribusi kargo berat/besar skala bisnis (furnitur, elektronik besar, otomotif). Berat **hingga 300 kg**, dimensi maks **100x100x180 cm**. SLA **1-3 hari**. | Cargo Truck / Blind Van | Wajib armada mobil/truk kargo, penanganan muatan berat (*pallet/heavy handling*). |
| 7 | **Mini Cargo** | Solusi pengiriman UMKM untuk paket berat dan ukuran sedang dengan berat **di atas 4 kg**. SLA **1-3 hari** dengan harga ekonomis. | Van / Motor Khusus | Optimalisasi muatan paket UMKM menengah (> 4 kg s/d 40 kg). |
| 8 | **PHARMA** | Distribusi alat kesehatan, vaksin, reagen, dan obat berstandar regulasi BPOM. Penjagaan suhu tertentu (15°C–25°C atau dingin). | Van / Dedicated Motor | Kurir SATRIA berdedikasi khusus Pharma dengan sertifikasi SOP penanganan farmasi BPOM. |
| 9 | **Frozen** | Pengiriman produk beku & sensitif suhu dingin (**-2°C hingga 5°C**). Tiba di **hari yang sama (*Same Day*)** maksimal 22.00 WIB. | Motor / Van dengan Tas Termal / Freezer | Dilengkapi *ice gel*, *cooler box*, atau tas termal aktif. Peringatan otomatis jika suhu melampaui batas aman. |

---

### 4. Tujuan & Metrik Keberhasilan Bisnis
* **Tingkat Kepatuhan SLA (*SLA Compliance*):** Mencapai tingkat kepatuhan penyerahan paket sebesar **≥ 97.5%** (menekan *SLA Breached* **< 2.5%**) di seluruh jenis layanan.
* **Kecepatan Penanganan Kendala:** Mempercepat respon penanganan kendala lapangan dari rata-rata 15 menit menjadi **< 3 menit** (efisiensi **75%**).
* **Durasi Pengalihan Tugas (*One-Click Task Reassignment*):** Memangkas proses pengalihan beban paket menjadi **< 30 detik** per aksi dengan validasi kompatibilitas armada 100% akurat.
* **Penekanan Kerusakan Layanan Khusus:** Menekan insiden kegagalan suhu *Frozen / Pharma* dan kerusakan segel *Dokumen* hingga **< 0.5%**.
* **Efisiensi Komunikasi Operasional:** Mengurangi koordinasi chat manual menjadi **< 25 pesan/hari/hub**.

---

### 5. Lingkup (Scope)
* **Di Dalam Scope (In-Scope MVP):**
  1. **Live Monitoring Map:** Peta interaktif React-Leaflet dengan filter 9 layanan pengiriman, pembedaan ikon armada (Motor, Van, Kargo), dan indikator anomali suhu.
  2. **SLA Risk Indicator Panel:** Panel tabel auto-sort berbasis sisa waktu SLA per layanan (*Instant/Same Day/Frozen* berbasis menit, *Next Day/Regular/Cargo* berbasis milestone jam/hari).
  3. **One-Click Task Reassignment:** Pengalihan tugas satu-klik dengan mesin filter kompatibilitas kurir (kesesuaian kendaraan, ketersediaan tas termal *Frozen*, dan sertifikasi *PHARMA*).
  4. **Quick Incident Reporting:** Integrasi sinyal kendala cepat (cuaca banjir/hujan badai, kemacetan Jakarta, kerusakan kendaraan, anomali suhu pendingin, segel dokumen rusak).
* **Di Luar Scope (Out-of-Scope MVP):**
  * Penugasan otomatis berbasis algoritma kecerdasan buatan (*AI/ML auto-dispatch*) tanpa persetujuan Admin Hub.
  * Pembangunan aplikasi seluler kurir baru secara mandiri (menggunakan integrasi API / WebSocket ke aplikasi SATRIA yang sudah ada).
  * Halaman pelacakan publik untuk pembeli akhir e-commerce.

---

### 6. Batasan & Kebutuhan Non-Fungsional (NFR)
* **Arsitektur & Tech Stack:** React.js, Tailwind CSS, Express.js (Node.js), PostgreSQL, Drizzle ORM, Socket.io, Redis Cache.
* **Latensi Telemetri GPS:** Maksimal **3.0 detik** dari transmisi kurir hingga render di peta.
* **Latensi Notifikasi SLA & Insiden:** Maksimal **5.0 detik** via Socket.io.
* **Ketersediaan Sistem (*Uptime*):** **99.9%** pada jendela operasional 06:00 – 22:00 WIB.
* **Keamanan Data Layanan Dokumen & Pharma:** Enkripsi data resi dan penguncian audit log untuk pelaporan kepatuhan regulasi BPOM dan perbankan.

---

### 7. Daftar Fitur & Acceptance Criteria (Kriteria Penerimaan)

#### Prioritas 1 (P0 - MVP Core / Tahap 1: Minggu 1–4)

1. **Peta Pemantauan Langsung (*Live Monitoring Map*)**
   * **Deskripsi:** Menampilkan posisi kurir SATRIA dan titik tujuan paket (`Drop_Latitude`, `Drop_Longitude`) di wilayah operasional Indonesia dengan filter 9 layanan pengiriman dan jenis kendaraan.
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-01.1:** *Given* kurir aktif bertugas di area Jabodetabek, *When* perangkat mentransmisikan telemetri GPS via Socket.io, *Then* marker posisi kurir berpindah di peta dalam latensi ≤ 3.0 detik.
     * **AC-01.2:** *Given* admin mengaktifkan filter tipe layanan (misal: "Frozen" atau "Cargo"), *When* filter dipilih, *Then* peta hanya menampilkan kurir dan titik tujuan yang melayani layanan tersebut.
     * **AC-01.3:** *Given* kurir membawa paket *Frozen* dan sensor mendeteksi suhu > 5.0°C, *When* data diterima sistem, *Then* marker kurir memunculkan indikator peringatan termal (*Cold-Chain Alert* warna Oranye/Merah berkedip).
     * **AC-01.4:** *Given* kurir kehilangan koneksi internet > 15 detik, *When* terdeteksi backend, *Then* ikon marker kurir berubah menjadi warna abu-abu (*Offline*).

2. **Panel Indikator Risiko SLA (*SLA Risk Indicator Panel*)**
   * **Deskripsi:** Menghitung sisa waktu SLA secara dinamis berdasarkan formula spesifik 9 layanan Anteraja dan mengurutkan paket paling kritis di posisi teratas secara otomatis.
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-02.1:** *Given* daftar paket aktif di hub, *When* panel dimuat, *Then* paket diurutkan otomatis secara *Ascending* berdasarkan `sla_remaining_time`.
     * **AC-02.2:** *Given* layanan berdurasi cepat (*Instant*, *Same Day*, *Frozen*):
       * Sisa SLA < 15 menit: status **HIGH_RISK** (Warna **Merah Flashing**).
       * Sisa SLA 15–30 menit: status **MEDIUM_RISK** (Warna **Kuning**).
       * Sisa SLA > 30 menit: status **SAFE** (Warna **Hijau**).
       * Melewati batas (misal > 22:00 WIB untuk Same Day/Frozen atau > deadline Instant): status **BREACHED**.
     * **AC-02.3:** *Given* layanan berdurasi hari (*Next Day*, *Regular*, *Dokumen*, *Cargo*, *Mini Cargo*), *When* sisa durasi mendekati *cutoff* pengiriman hari berjalan (< 2 jam sebelum cutoff), *Then* sistem menaikkan tingkat risiko ke **MEDIUM_RISK** / **HIGH_RISK**.
     * **AC-02.4:** *Given* admin mengklik baris paket pada tabel SLA, *When* diklik, *Then* peta melakukan *auto-zoom* dan menyorot marker kurir pembawa serta titik tujuan pengiriman di wilayah Indonesia.

---

#### Prioritas 2 (P1 - MVP Extension / Tahap 2: Minggu 5–8)

3. **Pengalihan Tugas Satu-Klik (*One-Click Task Reassignment*)**
   * **Deskripsi:** Memindahkan paket terkendala ke kurir lain yang memenuhi kualifikasi armada dan kualifikasi layanan (*Compatibility Matching Engine*).
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-03.1:** *Given* paket layanan *Cargo* (> 40 kg atau volume besar) perlu dialihkan, *When* admin membuka modal pengalihan, *Then* sistem hanya merekomendasikan kurir dengan moda armada *Van* atau *Cargo Truck* (mengecualikan kurir motor).
     * **AC-03.2:** *Given* paket layanan *PHARMA* atau *Frozen* perlu dialihkan, *When* admin mencari kurir pengganti, *Then* sistem memfilter kurir yang memiliki sertifikasi BPOM (*Pharma*) atau perlengkapan tas termal aktif (*Frozen*).
     * **AC-03.3:** *Given* kurir kandidat memiliki beban kerja ≥ 20 paket atau status *Offline*, *When* dievaluasi sistem, *Then* kurir tersebut dinonaktifkan dari daftar rekomendasi.
     * **AC-03.4:** *Given* admin mengonfirmasi pengalihan kurir, *When* dikonfirmasi, *Then* database PostgreSQL dan Redis diperbarui dalam < 2 detik, dan rute baru diterima kurir pengganti dalam total waktu < 30 detik.

4. **Pelapor Kendala Cepat (*Quick Incident Reporting*)**
   * **Deskripsi:** Menangkap sinyal kendala fisik lapangan kurir dari aplikasi seluler SATRIA (termasuk kendala spesifik Indonesia dan spesifik layanan) dan menampilkan notifikasi aksi cepat di dasbor admin.
   * **Acceptance Criteria (Kriteria Penerimaan):**
     * **AC-04.1:** *Given* kurir mengalami kendala di jalan (Banjir, Cuaca Buruk, Ban Bocor, Anomali Suhu Pendingin, Segel Rusak), *When* kurir mengirim sinyal dalam maksimal 3 ketukan di ponsel, *Then* notifikasi *actionable alert* muncul di layar Admin Hub dalam durasi ≤ 5.0 detik.
     * **AC-04.2:** *Given* notifikasi kendala bertipe *Anomali Suhu Frozen* atau *Kendaraan Kargo Mogok*, *When* muncul di dasbor, *Then* sistem menampilkan tombol aksi instan: "Pengalihan Rute Darurat" dan "Perpanjang Buffer SLA".
     * **AC-04.3:** *Given* laporan kendala tidak ditindaklanjuti admin dalam waktu > 10 menit, *When* batas terlampaui, *Then* sistem memicu alarm eskalasi (*Escalation Alert* berkedip) dan mencatat log insiden ke Manager Hub.

---

### 8. Keputusan Terbuka (Open Decisions)
* **Open Decision 1 (GIS Engine):** Pemilihan antara *library* peta *open-source* (`Leaflet.js` / OpenStreetMap yang efisien dan bebas lisensi) vs Google Maps API (lebih presisi untuk rute gang di kota-kota Indonesia).
* **Open Decision 2 (Dataset Telemetri Testing — Data Tiruan / Dummy):** Pemanfaatan dataset tiruan sintetis (*synthetic dummy data*) [`docs/data/delivery.csv`] yang digenerasi secara khusus untuk pengujian antarmuka, visualisasi peta, dan simulasi skenario pengiriman 9 jenis layanan Anteraja. **Catatan:** Seluruh data (resi, nama kurir, koordinat, dan status) adalah data dummy dan bukan data produksi/rahasia Anteraja.
* **Open Decision 3 (Formula Bobot Hambatan Lapangan):** Penerapan penyesuaian durasi SLA dinamis berdasarkan variabel cuaca tropis (`Weather`: *Hujan Deras*, *Banjir*) dan tingkat kemacetan perkotaan Indonesia (`Traffic`: *Padat*, *Macet Total*).

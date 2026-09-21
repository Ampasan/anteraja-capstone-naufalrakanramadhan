# Functional Requirement Document (FRD) — One-Click Task Reassignment

---

### 1. Konteks
Fitur **One-Click Task Reassignment** (Pengalihan Tugas Satu-Klik) dirancang untuk memfasilitasi Admin Hub dalam memindahkan paket dari kurir yang mengalami kendala ke kurir lain yang tersedia secara instan. Fitur ini merujuk pada **00-PRD-courier-admin-mini-panel-v2.md** Bagian 4 (In-Scope F-03) dan Bagian 7 untuk memangkas durasi penugasan ulang rute dari hitungan menit menjadi **< 30 detik** per rute.

---

### 2. Peran & Hak Akses

| Peran (Role) | Lihat (Read) | Buat (Create) | Ubah (Update) | Setujui (Approve) | Field Terkunci (Locked Fields) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Admin Hub Operasional** | ✅ Ya | ✅ Ya (Trigger Modal) | ✅ Ya (Reassign) | ✅ Ya (Eksekusi Klik) | `Order_ID`, `original_courier_id` |
| **Kurir SATRIA (Mobile App)** | ✅ Ya (Rute Baru) | ❌ Tidak | ❌ Tidak | ❌ Tidak | `assigned_by_admin_id` |
| **System (Backend & Database)** | ✅ Ya | ✅ Ya (Audit Log) | ✅ Ya (Status Rute) | ✅ Ya | `reassignment_timestamp` |
| **Customer Care / Hub Manager** | ✅ Ya (Read-only) | ❌ Tidak | ❌ Tidak | ❌ Tidak | Semua Field Sistem |

---

### 3. Alur

```mermaid
graph TD
    A[Admin Hub Identifikasi Kurir Terkendala di Peta / Panel SLA] --> B[Klik Tombol Pengalihan Rute pada Baris Paket]
    B --> C[Sistem Tampilkan Modal Pemilihan Kurir Rekomendasi]
    C --> D[Backend Filter Kurir Aktif, Beban < 20 Paket, & Kualifikasi Armada]
    D --> E[Admin Pilih Kurir Penerima & Klik Konfirmasi Satu-Klik]
    E --> F[Update Database PostgreSQL & Redis Cache < 2s]
    F --> G[WebSocket Broadcast Push Notification Rute Baru ke Mobile App Kurir B]
    G --> H[Update Status ETA ke API Customer Care System]
    H --> I[UI Admin Hub Tampilkan Pop-Up Sukses & Status Kendala RESOLVED]
```

#### Pernyataan Alur Kebutuhan (EARS Pattern):
* **KETIKA** Admin Hub mengklik tombol "Pengalihan Rute" pada satu atau sekumpulan paket, sistem **harus** menampilkan modal daftar rekomendasi kurir penerima tugas terdekat.
* **KETIKA** Admin Hub mengonfirmasi pengalihan tugas dengan mengklik tombol "Konfirmasi Pengalihan", sistem **harus** memindahkan alokasi paket di PostgreSQL dan Redis Cache dalam waktu < 2 detik.
* **JIKA** kurir penerima tugas berada dalam status *OFF_DUTY*, beban kerja melampaui batas maksimal (20 paket), atau tidak memenuhi kualifikasi armada (*Cargo* wajib van/truck, *Frozen* wajib tas termal, *PHARMA* wajib sertifikasi BPOM), sistem **harus** menolak pengalihan dan menampilkan pesan peringatan "Kurir Tidak memenuhi Kualifikasi / Overload".
* **JIKA** pengalihan tugas berhasil dieksekusi, sistem **harus** mengirimkan push notification rute baru ke aplikasi seluler kurir penerima via WebSocket dan memperbarui estimasi waktu tiba (*ETA*) di sistem Customer Care.
* **SELAMA** proses pengalihan berlangsung, sistem **harus** mencatat jejak audit (*audit log*) berisi ID admin, ID kurir asal, ID kurir tujuan, dan stempel waktu eksekusi.

---

### 4. Aturan Bisnis

| ID Rule | Kondisi / Pemicu | Hasil / Perilaku Sistem | Pengecualian |
| :--- | :--- | :--- | :--- |
| **BR-01** | Total waktu eksekusi dari input klik admin hingga rute baru diterima kurir. | Seluruh alur pengalihan tugas wajib selesai dalam durasi **< 30.0 detik**. | Jika terjadi kerusakan total jaringan internet (*total blackout*). |
| **BR-02** | Pemilihan kurir penerima pengalihan (*assignee*). | Sistem hanya merekomendasikan kurir berstatus **ONLINE** dengan beban paket aktif **< 20 paket** serta kualifikasi armada yang sesuai (*Cargo*->Van, *Frozen*->Tas Termal, *PHARMA*->BPOM). | Admin memilih opsi *Override Force Assign* dengan alasan darurat. |
| **BR-03** | Pengalihan tugas kelompok (*bulk reassignment*). | Admin dapat memindahkan maksimal **10 paket sekaligus** dalam 1 aksi pengalihan. | - |
| **BR-04** | Eksekusi pengalihan sukses dicatat di database. | Sistem secara otomatis mengirimkan panggilan webhook/socket untuk memperbarui status *ETA* paket pada antarmuka **Customer Care**. | - |
| **BR-05** | Kurir asal mengalami kendala `Vehicle = Breakdown` atau `Weather = Hujan Deras / Banjir`. | Sistem memprioritaskan kurir rekomendasi yang mengoperasikan tipe kendaraan *Van*, *Blind Van*, atau *Pick Up Box*. | - |

---

### 5. Istilah

* **Task Reassignment:** Proses memindahkan hak pengiriman paket dari kurir pertama ke kurir kedua di lapangan.
* **Assignee Courier:** Kurir yang ditunjuk untuk menerima alokasi beban pengiriman paket baru.
* **ETA (Estimated Time of Arrival):** Perkiraan jam penyerahan paket sampai ke tangan penerima.
* **Audit Log:** Catatan riwayat aktivitas sistem yang merekam siapa, kapan, dan perubahan apa yang dilakukan.
* **Compatibility Matching:** Validasi kualifikasi armada kurir penerima berdasarkan jenis layanan paket (*Cargo*, *Frozen*, *PHARMA*).

---

### 6. Data Utama & Status

#### Data Utama yang Disimpan:
* `Order_ID` (String - Resi)
* `original_courier_id` (String - ID Kurir Asal)
* `new_courier_id` (String - ID Kurir Tujuan)
* `assigned_by_admin_id` (String - ID Admin Pengeksekusi)
* `reassignment_reason` (Text - Alasan Pengalihan)
* `reassignment_timestamp` (Timestamp - Waktu Eksekusi)
* `execution_duration_ms` (Integer - Durasi Eksekusi dalam ms)

#### Daftar Status Pengalihan Tugas:
```
[ASSIGNED] ---> [REASSIGNMENT_PENDING] ---> [REASSIGNED_SUCCESS] ---> [ACKNOWLEDGED_BY_COURIER]
```

---

### 7. Daftar Fungsi

* **F-03.1 Reassignment Recommendation Modal:** Menampilkan daftar kurir terdekat yang tersedia berdasarkan lokasi GPS, kualifikasi armada, dan beban kerja.
* **F-03.2 One-Click Execution Controller:** Memproses pembaruan data penugasan paket pada PostgreSQL dan Redis Cache dalam waktu < 2.0 detik.
* **F-03.3 Mobile Route Push Dispatcher:** Mengirimkan sinyal pembaruan rute pengiriman ke aplikasi seluler kurir penerima via WebSocket.
* **F-03.4 Customer Care ETA Synchronizer:** Mengirimkan pembaruan *ETA* paket secara otomatis ke sistem Customer Care.

---

### 8. AC Alur Utama (Acceptance Criteria - Data Nyata `delivery.txt`)

#### Skenario 1: Pengalihan Paket Regular Terkendala Macet Total & Hujan Deras
* **Diberikan:** Admin Hub (Siti) menerima laporan kendala dari Indra Gunawan (`STR-BDG-004`, Vehicle: `Blind Van`) yang membawa resi `100024000104` (Layanan: `Regular`, `HUB-BDG-BATUNUNGGAL`, `Weather: Hujan Deras`, `Traffic: Macet Total`, Sisa SLA: -30 menit / `BREACHED`).
* **Ketika:** Admin Siti memilih resi `100024000104`, mengklik tombol "Pengalihan Rute", memilih Kurir Eko Prasetyo (`STR-JKT-006`, Vehicle: `Pick Up Box`, lokasi 500m dari Kurir Indra, beban 10 paket), dan mengklik "Konfirmasi Pengalihan Satu-Klik" pada pukul 12:16:00.
* **Maka:** Database PostgreSQL ter-update, rute resi `100024000104` berpindah ke Kurir Eko Prasetyo, notifikasi rute baru muncul di ponsel Kurir Eko Prasetyo, dan status *ETA* di Customer Care ter-update dalam total waktu **12.4 detik** (memenuhi BR-01 < 30 detik).

#### Skenario 2: Penolakan Pengalihan ke Kurir dengan Beban Kerja Penuh
* **Diberikan:** Admin Hub mencoba memindahkan paket resi `100024000108` (`PHARMA`, Agus Prayitno) ke Kurir Wahyu Hidayat (`STR-SBY-005`).
* **Ketika:** Kurir Wahyu Hidayat terdeteksi di database memiliki beban pengiriman aktif sebanyak **22 paket** (> 20 paket).
* **Maka:** Sistem menolak tindakan pengalihan, menonaktifkan tombol konfirmasi untuk Kurir Wahyu Hidayat, dan menampilkan pesan peringatan merah "Kurir Wahyu Hidayat Memiliki Beban Kerja Maksimal (22/20 Paket)" (memenuhi BR-02).

---

### 9. Tidak Termasuk (Out-of-Scope)

* **Otomatisasi Pengalihan Berbasis AI/ML:** Pengalihan wajib dikonfirmasi oleh Admin Hub secara manual, bukan dipindahkan secara otomatis oleh algoritma kecerdasan buatan.
* **Kalkulasi Insentif Pengalihan:** Sistem tidak menghitung pembagian skema bonus/penalti keuangan akibat pemindahan paket antar-kurir.
* **Persetujuan dari Penerima Paket:** Pengalihan tugas internal tidak memerlukan persetujuan dari penerima barang *e-commerce*.

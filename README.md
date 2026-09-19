# Anteraja Capstone: Courier Admin Mini-Panel

Proyek capstone ini berfokus pada pengembangan fitur **Courier Admin Mini-Panel** untuk sistem logistik Anteraja di Indonesia. Panel ini dirancang secara khusus untuk memfasilitasi Admin Hub (Staging Store) dalam memonitor, mengelola, dan mengoptimalkan operasional kurir SATRIA di lapangan secara *real-time* di tengah dinamika pengiriman perkotaan Indonesia.

## Latar Belakang & Objektif

Dalam ekosistem logistik Anteraja, visibilitas *real-time* dan adaptabilitas terhadap berbagai jenis paket sangat krusial. Melalui dashboard ini, admin dapat:
- **Melacak Armada & Paket Real-Time:** Memantau pergerakan kurir SATRIA (Motor, Van, Truk Kargo) dan sebaran paket di peta digital interaktif.
- **Kalkulasi SLA Dinamis Multi-Layanan:** Mendeteksi risiko keterlambatan pengiriman secara dini berbasis formula spesifik dari 9 jenis layanan pengiriman Anteraja.
- **Pengalihan Tugas Satu-Klik Kompatibel:** Mengalihkan rute paket terkendala ke kurir terdekat dengan validasi kecocokan armada, kualifikasi pendingin (*Frozen*), dan sertifikasi BPOM (*PHARMA*).
- **Resolusi Cepat Kendala Lapangan:** Menanggapi laporan insiden fisik (banjir, macet parah, ban bocor, anomali suhu termal, segel dokumen cacat) dalam waktu < 3 menit.

---

## Struktur Dokumentasi (Docs)

Dokumentasi lengkap proyek tersimpan rapi dalam folder `docs/`:

### 1. Product Requirements Document (PRD)
Berisi visi produk, latar belakang masalah, persona pengguna, taksonomi 9 layanan Anteraja, KPI bisnis, dan *Acceptance Criteria* berbasis konteks Indonesia.
* **File Utama:** [`docs/00-PRD-courier-admin-mini-panel.md`]

### 2. Functional Requirements Document (FRD)
Merinci spesifikasi fungsional, arsitektur teknis, aturan bisnis (*Business Rules*), alur EARS, matriks kompatibilitas armada, dan skenario pengujian dengan data simulasi Indonesia.
* **FRD Induk (Master FRD):** [`docs/FRD-00-courier-admin-mini-panel.md`]
* **Modul Terpisah (`docs/frd/`):**
  - [`FRD-01-live-monitoring-map.md`] — Pemantauan peta live, filter 9 layanan, ikon armada, dan alert suhu rantai dingin.
  - [`FRD-02-sla-risk-indicator-panel.md`] — Panel auto-sort kalkulator risiko SLA multi-layanan & cross-highlighting ke peta.
  - [`FRD-03-one-click-task-reassignment.md`] — Pengalihan rute satu-klik dengan mesin validasi kualifikasi kurir & jenis kendaraan.
  - [`FRD-04-quick-incident-reporting.md`] — Pelaporan kendala mobile 3-ketukan, actionable alerts, dan auto-escalation.

### 3. Data Operasional & Simulasi (`docs/data/`)
* **Dataset Simulasi:** [`docs/data/delivery.csv`]
Seluruh isi berkas `docs/data/delivery.csv` adalah **dummy data**. Data ini dibuat secara khusus untuk memfasilitasi perancangan *wireframe/mockup*, simulasi alur antarmuka, dan pengujian algoritma sistem. Dataset ini memuat catatan pengiriman yang mencakup 9 varian layanan Anteraja, profil armada SATRIA (Motor, Van, Truk Kargo), koordinat GPS Staging Hub & alamat di wilayah Jabodetabek/Indonesia, telemetri live, suhu rantai dingin, status SLA (`SAFE`, `MEDIUM_RISK`, `HIGH_RISK`, `BREACHED`), dan status insiden operasional.

---

## Modul Utama Sistem

1. **Live Monitoring Map Module**  
   - *Telemetry Receiver Service*: Menerima dan memvalidasi payload GPS dan suhu termal dari kurir via Socket.io.  
   - *Interactive Multi-Service Map Renderer*: Menampilkan peta React-Leaflet dengan filter 9 layanan dan simbol jenis kendaraan (Motor, Van, Kargo).  
   - *Info Popup Component*: Menampilkan rincian resi, nama kurir SATRIA, tipe layanan, suhu, dan sisa SLA secara instan saat marker diklik.  
   - *Cold-Chain & Offline Handler*: Mengelola indikator sinyal, menandai kurir offline (>15s), dan mendeteksi anomali suhu rantai dingin (>5°C).

2. **SLA Risk Indicator Panel**  
   - *Dynamic Multi-Service SLA Calculator*: Menghitung sisa SLA berbasis formula spesifik 9 layanan serta bobot hambatan cuaca banjir dan macet total.  
   - *Auto-Sorting Risk List Component*: Mengurutkan daftar paket secara ascending pada tabel React sesuai tingkat urgensi risiko.  
   - *Visual Risk Color Coder*: Menerapkan pengkodean warna dinamis (Merah Flashing, Kuning, Hijau) dan lencana layanan.  
   - *Map Cross-Highlight Synchronizer*: Sinkronisasi klik baris tabel dengan auto-zoom posisi kurir dan titik tujuan di peta.

3. **One-Click Task Reassignment Module**  
   - *Compatibility Matching Evaluator*: Memfilter kurir aktif (beban < 20 paket) dengan validasi armada (mobil/truk untuk *Cargo*), perlengkapan tas termal (*Frozen*), dan sertifikasi BPOM (*PHARMA*).  
   - *One-Click Execution Controller*: Memproses pemindahan tugas di PostgreSQL & Redis Cache dalam waktu < 2 detik.  
   - *Dispatch & ETA Synchronizer*: Mengirim push-notification ke kurir pengganti via Socket.io serta memperbarui ETA di Customer Care API.

4. **Quick Incident Reporting Module**  
   - *Mobile Incident Dispatcher*: Antarmuka 3 ketukan layar untuk melaporkan kendala cuaca banjir, macet, mogok, anomali suhu, atau segel dokumen cacat.  
   - *Actionable Alert Engine*: Memicu pop-up alert interaktif di dasbor admin dalam waktu ≤ 5 detik dengan tombol aksi langsung (*Reassign* / *Adjust Buffer*).  
   - *Escalation & History Logger*: Menangani eskalasi alarm jika laporan tidak ditanggapi dalam 10 menit serta mencatat audit log lengkap.
# Anteraja Capstone: Courier Admin Mini-Panel

Proyek capstone ini berfokus pada pengembangan fitur **Courier Admin Mini-Panel** untuk sistem logistik Anteraja. Panel ini dirancang secara khusus untuk memfasilitasi admin dalam memonitor, mengelola, dan mengoptimalkan operasional kurir di lapangan secara *real-time*.

## Latar Belakang & Objektif

Dalam ekosistem logistik yang dinamis, visibilitas *real-time* sangat krusial untuk memastikan kepuasan pelanggan dan efisiensi operasional. Melalui dashboard ini, admin dapat:
- Melacak status pengiriman dan memantau performa kurir secara *real-time*.
- Mengelola penugasan rute dengan lebih presisi dan efisien.
- Mempercepat resolusi kendala operasional (seperti kendala cuaca, rute, atau *SLA risk*) yang terjadi di lapangan.

## Struktur Dokumentasi (Docs)

Untuk memastikan transparansi pengembangan dan menyelaraskan tujuan bisnis dengan arsitektur teknis, repositori ini telah dilengkapi dengan direktori `docs/` yang berisi dokumen proyek krusial:

### 1. Product Requirements Document (PRD)
Berisi visi produk, latar belakang masalah, persona pengguna, dan metrik kesuksesan dari *Courier Admin Mini-Panel*. Dokumen ini bertindak sebagai "kompas" bisnis untuk tim pengembangan.
* **File Utama:** [`docs/00-PRD-courier-admin-mini-panel.md`]

### 2. Functional Requirements Document (FRD)
Merinci spesifikasi fungsional dan teknis dari fitur yang akan dibangun. Dokumen ini mendeskripsikan secara detail pemecahan fungsi sistem (seperti *Live Monitoring Map Module* dan *SLA Risk Indicator Panel*), aliran interaksi pengguna (*User Flow*), arsitektur komponen, serta *edge cases*.
* **File Utama:** [`docs/FRD-00-courier-admin-mini-panel.md`]
* **Modul Terpisah:** Berada dalam folder `docs/frd/`

### 3. Data & Dataset (`docs/data/`)
Direktori ini difungsikan untuk memuat dataset simulasi, mock data, atau sumber data awal yang akan dikonsumsi oleh aplikasi. Data ini krusial untuk tahap inisialisasi, *testing*, dan pengembangan *mockup* antarmuka sebelum terhubung dengan *backend* sesungguhnya.

## Modul Utama (Fitur Lengkap)

Berikut rincian lengkap masing‑masing modul utama yang akan diimplementasikan dalam **Courier Admin Mini-Panel**:

- **Live Monitoring Map Module**  
  - *Telemetry Receiver Service*: Menerima dan memvalidasi payload GPS dari kurir via Socket.io.  
  - *Interactive Map Renderer*: Menampilkan peta React-Leaflet dengan marker kurir dan titik tujuan paket.  
  - *Info Popup Component*: Menampilkan detail paket serta informasi kurir secara instan saat marker diklik.  
  - *Connection & Offline Handler*: Mengelola indikator sinyal, menandai kurir offline, serta melakukan *local buffering* ketika koneksi terputus.

- **SLA Risk Indicator Panel**  
  - *Dynamic SLA Calculator Engine*: Menghitung sisa waktu SLA secara real‑time berbasis waktu server dan variabel hambatan.  
  - *Auto‑Sorting Risk List Component*: Mengurutkan daftar paket secara ascending pada tabel React sesuai tingkat risiko.  
  - *Visual Risk Color Coder*: Menerapkan pengkodean warna dinamis (Merah, Kuning, Hijau) berdasarkan sisa SLA.  
  - *Map Cross‑Highlight Synchronizer*: Sinkronisasi klik baris tabel dengan auto‑zoom pada peta untuk memudahkan penelusuran.

- **One‑Click Task Reassignment Module**  
  - *Courier Reassignment Evaluator*: Memfilter kurir aktif dengan beban <20 paket dan merekomendasikan kandidat terbaik.  
  - *One‑Click Execution Controller*: Memproses pemindahan tugas di PostgreSQL & Redis Cache dalam <2 detik.  
  - *Dispatch & ETA Synchronizer*: Mengirim push‑notification ke kurir baru serta memperbarui ETA di Customer Care API.

- **Quick Incident Reporting Module**  
  - *Mobile Incident Dispatcher*: Antarmuka 3 ketukan untuk melaporkan kendala fisik kurir secara cepat.  
  - *Actionable Alert Engine*: Memicu pop‑up alert interaktif di dasbor admin dengan tombol aksi langsung.  
  - *Quick Action Handler*: Menyediakan aksi cepat seperti *Reassign* atau *Adjust SLA Buffer*.  
  - *Escalation & History Logger*: Menangani eskalasi bila laporan tidak ditanggapi dalam waktu tertentu serta mencatat audit log lengkap.
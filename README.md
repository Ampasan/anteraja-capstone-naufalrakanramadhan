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

---

## Arsitektur React (Branch: `8-react`)

Proyek ini direfaktorisasi dari jQuery ke arsitektur berbasis komponen React menggunakan **Vite + TypeScript (TSX)**. Seluruh UI dipecah menjadi *functional components* modular dengan aliran data satu arah (*Unidirectional Data Flow*).

## SPA Routing dengan React Router

Aplikasi menggunakan `BrowserRouter` di `src/main.tsx`. Definisi route berada di `src/App.tsx`, sehingga perpindahan modul terjadi di sisi klien tanpa *full-page refresh*.

### Route Map

| URL | Komponen | Keterangan |
| --- | --- | --- |
| `/` | Redirect | Mengarahkan ke login atau monitoring sesuai sesi. |
| `/login` | `LoginPage` | Halaman autentikasi. Setelah berhasil, `useNavigate` mengarah ke `/monitoring`. |
| `/monitoring` | `MonitoringPage` | Peta dan daftar kurir aktif. Mendukung query `?courier=:id` dari SLA panel. |
| `/sla` | `SlaRiskPage` | Indikator risiko SLA. Tombol peta menggunakan `useNavigate` ke monitoring. |
| `/incidents` | `IncidentsPage` | Penanganan insiden. Setelah reassign berhasil, aplikasi bernavigasi secara programatis ke `/audit`. |
| `/audit` | `AuditLogsPage` | Riwayat operasional. |
| `*` | `NotFoundPage` | Fallback 404 untuk URL yang tidak dikenal. |

### Persistent Layout dan Navigasi

`MainLayout` adalah parent route untuk semua modul dashboard. Komponen ini merender `Header`, `Sidebar`, dan `Footer` satu kali, lalu `<Outlet />` me-render halaman aktif di area konten. Dengan struktur nested route ini, shell navigasi tidak dimount ulang ketika pengguna pindah antar-modul.

`Sidebar` menggunakan `<NavLink>` agar status aktif mengikuti URL. `<Link>` dipakai pada halaman 404 untuk kembali ke aplikasi tanpa me-reload dokumen. URL yang sama sekali tidak terdaftar ditangani oleh `NotFoundPage`.

### Programmatic Routing

`useNavigate()` digunakan setelah aksi pengguna: login, logout, membuka lokasi kurir dari SLA panel, dan melanjutkan ke audit setelah reassignment.

---

### Struktur Susunan Komponen (Tree of Components)

```
App
├── LoginPage                          ← Auth gate (isAuthenticated = false)
│   ├── Card                           ← UI atom (elevated card wrapper)
│   ├── AuthHeader                     ← Branding logo + judul
│   └── LoginForm                      ← Semua field input (controlled)
│       ├── Input                      ← UI atom (reusable input)
│       └── Button                     ← UI atom (reusable button)
│
└── AppLayout                          ← Dasbor utama (isAuthenticated = true)
    ├── Header                         ← Topbar + info user + logout
    ├── Sidebar                        ← Navigasi halaman (activePage)
    └── [Page Content]                 ← Dirender berdasarkan activePage
        │
        ├── MonitoringPage             ← Orkestrator state Live Monitoring
        │   ├── CourierList            ← Panel daftar kurir (collapsible)
        │   │   └── CourierCard        ← Kartu kurir individual
        │   ├── MapView                ← Peta Leaflet interaktif
        │   ├── MapControls            ← Overlay kontrol peta
        │   ├── CourierDetailPanel     ← Panel detail kurir (floating)
        │   ├── AnomalyAlertToast      ← Toast notifikasi anomali
        │   └── EmergencyReassignModal ← Modal reassignment darurat
        │
        ├── SlaRiskPage                ← Panel indikator risiko SLA
        │   └── [SLA components]
        │
        ├── IncidentsPage              ← Halaman insiden & reassign
        │   └── [Incident components]
        │
        └── AuditLogsPage             ← Riwayat audit log
            └── [AuditLog components]
```

---

### Alur Props (Unidirectional Data Flow)

Data mengalir **satu arah**: dari komponen induk (Parent) ke komponen anak (Child) melalui props. Tidak ada mutasi props di komponen anak.

#### Contoh alur di fitur Monitoring:

```
App
│  props: onFullscreenChange, focusCourierId, onFocusHandled
▼
MonitoringPage  ← menggunakan useMonitoring() hook
│
├── CourierList
│     props (in) : couriers[], selectedCourier, activeFilter,
│                  searchQuery, counts, totalCount, isOpen
│     props (cb) : onSelectCourier, onFilterChange, onSearchChange, onToggle
│     └── CourierCard
│           props (in) : courier, isSelected
│           props (cb) : onClick
│
├── MapView
│     props (in) : couriers[], hub, selectedCourier, showRoutes
│     props (cb) : onCourierClick, onMapReady
│
├── MapControls
│     props (in) : showRoutes, isFullscreen, courierCount, hubRadiusKm, listCollapsed
│     props (cb) : onToggleRoutes, onToggleFullscreen, onShowCourierList
│
├── CourierDetailPanel
│     props (in) : courier, isFocusingRoute
│     props (cb) : onClose, onFocusRoute, onContact
│
├── AnomalyAlertToast
│     props (in) : anomaly
│     props (cb) : onReassign, onDismiss
│
└── EmergencyReassignModal
      props (in) : open, payload
      props (cb) : onClose, onConfirm
```

#### Contoh alur di fitur Auth:

```
App
│  props: onLoginSuccess
▼
LoginPage  ← menggunakan useAuth() hook
│
└── LoginForm
      props (in) : formState { hub, email, password, showPassword, rememberMe, error, isLoading }
      props (cb) : onHubChange, onEmailChange, onPasswordChange,
                   onRememberMeChange, onTogglePassword, onSubmit
```

---

### Alur State (`useState`)

State dikelola secara **lokal** di dalam custom hooks, tidak ada mutasi langsung (*direct state mutation*). Semua perubahan state dilakukan melalui setter function.

#### `useMonitoring` — Custom hook orkestrator state halaman monitoring

| State | Tipe | Nilai Awal | Keterangan |
|-------|------|-----------|------------|
| `selectedCourier` | `Courier \| null` | `null` | Kurir yang sedang dipilih |
| `activeFilter` | `CourierFilter` | `'all'` | Filter tab: all / online / idle |
| `searchQuery` | `string` | `''` | Teks pencarian kurir/resi |
| `isFocusingRoute` | `boolean` | `false` | Mode fokus rute aktif |
| `isFullscreen` | `boolean` | `false` | Mode peta penuh |
| `showAnomalyToast` | `boolean` | `true` | Visibilitas toast anomali |
| `showReassignModal` | `boolean` | `false` | Modal reassignment terbuka |
| `showRoutes` | `boolean` | `true` | Toggle tampilan polyline rute |
| `mapRef` | `LeafletMap \| null` | `null` | Referensi instance peta Leaflet |

State `filteredCouriers` dan `counts` diturunkan dengan **`useMemo`** dari `allCouriers`, `activeFilter`, dan `searchQuery` — tidak disimpan sebagai state terpisah untuk menghindari stale state.

#### `useAuth` — Custom hook state form login

| State | Tipe | Keterangan |
|-------|------|------------|
| `formState.hub` | `string` | Pilihan hub yang dipilih |
| `formState.email` | `string` | Input email (controlled) |
| `formState.password` | `string` | Input password (controlled) |
| `formState.showPassword` | `boolean` | Toggle visibilitas password |
| `formState.rememberMe` | `boolean` | Checkbox remember me |
| `formState.error` | `string \| null` | Pesan error validasi |
| `formState.isLoading` | `boolean` | Status loading saat submit |

#### `App` — State navigasi global

| State | Tipe | Keterangan |
|-------|------|------------|
| `isAuthenticated` | `boolean` | Auth gate (disimpan ke `sessionStorage`) |
| `activePage` | `PageId` | Halaman aktif: monitoring / sla / incidents / audit |
| `hideSidebar` | `boolean` | Sidebar disembunyikan saat fullscreen |
| `focusCourierId` | `string \| undefined` | ID kurir untuk auto-focus dari halaman lain |
| `animKey` | `number` | Key animasi — bertambah setiap ganti halaman |

---

### Penerapan Teknis Utama

| Kriteria | Implementasi |
|----------|-------------|
| **Functional Components** | Semua komponen adalah function (tidak ada class component) |
| **Props** | Interface TypeScript eksplisit untuk setiap props; tidak ada mutasi |
| **useState** | Controlled components di `LoginForm`; seluruh state di custom hooks |
| **Dynamic List Rendering** | `.map()` + `key={courier.id}` / `key={tab.id}` di `CourierList`, dll. |
| **Conditional Rendering** | Ternary operator (`isFullscreen ? ... : ...`) dan logical `&&` |
| **useEffect** | Sync fullscreen ke parent, `map.invalidateSize()`, auto-focus kurir |
| **useCallback** | Semua handler di-wrap `useCallback` untuk mencegah re-render tidak perlu |
| **useMemo** | `filteredCouriers` dan `counts` diturunkan secara *derived* |
| **TSX Syntax** | `className` (bukan `class`), semua tag ditutup presisi, tidak ada warning konsol |

---

## Asynchronous Data Fetching, Custom Hooks, dan Context API

Fitur Live Monitoring memakai dua Public API secara asynchronous:

| API | Modul | Penggunaan antarmuka |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | `src/api/openMeteo.ts` | Menampilkan kondisi cuaca, suhu, dan kecepatan angin pada panel detail kurir. |
| [Nominatim OpenStreetMap](https://nominatim.openstreetmap.org/) | `src/api/nominatim.ts` | Mengubah koordinat GPS kurir menjadi nama jalan/lokasi pada popup marker peta. |

### Struktur Custom Hooks

```
src/
├── api/
│   ├── openMeteo.ts          # Client dan normalisasi respons Open-Meteo
│   └── nominatim.ts          # Client reverse geocoding Nominatim
├── hooks/
│   ├── useAsync.ts           # State reusable: data, loading, error, pembatalan request
│   ├── useWeather.ts         # useEffect untuk data cuaca berdasarkan latitude/longitude
│   └── useReverseGeocode.ts  # useEffect untuk nama lokasi berdasarkan latitude/longitude
└── context/
    ├── AppContext.tsx        # Provider/store global kurir yang sedang dipilih
    ├── AppContextStore.ts    # Definisi Context agar Fast Refresh tetap aman
    └── useAppContext.ts      # Custom Context Hook untuk consumer UI
```

`useWeather` dan `useReverseGeocode` membungkus client API dan memanggilnya di dalam `useEffect`. Dependency array hanya bergantung pada fungsi `reload` yang stabil dan koordinat, sehingga request baru hanya terjadi ketika posisi kurir berubah. Tiap request memakai `AbortController`; cleanup pada `useEffect` membatalkan request lama ketika komponen unmount atau koordinat berubah. `useAsync` juga memverifikasi ID request aktif sebelum mengubah state, sehingga respons request yang sudah tidak relevan tidak dapat menimpa data terbaru.

Setiap hasil fetch mempunyai state visual yang eksplisit: teks loading yang informatif, data hasil fetch, pesan error, serta aksi **Coba lagi/Muat ulang**. Error dari `fetch` ditangani dengan `try/catch` di `useAsync` dan ditampilkan tanpa menyembunyikan konteks panel kurir.

### Arsitektur Context API

`AppProvider` dipasang di `src/main.tsx` dan menyediakan `selectedCourierId` serta aksi `selectCourier`. Hook `useAppContext()` adalah satu-satunya akses consumer ke Context dan akan memberi error jelas jika dipakai di luar provider. `useMonitoring()` mengonsumsi hook ini untuk menyimpan kurir terpilih secara global; pemilihan dari daftar atau marker peta tetap tersinkron tanpa meneruskan ID kurir melalui hierarchy props yang lebih tinggi.

# Dokumentasi Implementasi User Experience (UX) & Interaktivitas DOM

## 1. Prinsip & Filosofi Perancangan UX

Mini-panel ini diperuntukkan bagi **Admin Hub / Staging Store Anteraja** yang beroperasi dalam lingkungan kerja bertempo tinggi (*high-stress, time-sensitive environment*). Oleh karena itu, antarmuka dirancang dengan berpegang pada 4 pilar utama UX:

1. **Navigasi yang Mudah Dioperasikan (*Effortless Navigation*)**:
   - Sidebar navigasi tetap (*sticky sidebar*) dengan penanda halaman aktif yang kontras.
   - Panel samping geser (*side drawers/sheets*) untuk menampilkan detail tanpa memaksa pengguna berpindah halaman (*context retention*).
   - Akses keyboard cepat (tombol `Escape` untuk menutup drawer/modal secara instan).

2. **Fitur Pencarian yang Efisien (*Zero-Latency Search & Filter*)**:
   - Filter instan tanpa muat ulang halaman (*client-side reactive filtering*).
   - Pencarian cerdas berbasis nomor resi (AWB) dan nama kurir dengan teknik *debouncing* agar tidak membebani performa browser.
   - Tabulasi status resiko yang terorganisir (*All, High Risk, Medium Risk, Safe*) dengan badge warna berbasis urgensi.

3. **Formulir yang Sederhana & Taktis (*Frictionless Input Forms*)**:
   - Konsep **3-Tap Reporting**: Menggantikan kolom isian teks panjang dengan kartu pilihan visual (*visual selection tiles*).
   - Pratinjau berkas gambar secara *real-time* saat kurir/admin mengunggah foto kendala lapangan.
   - Validasi formulir secara *inline* dengan pesan peringatan yang langsung terlihat (*instant visual feedback*).

4. **Kognisi & Kesadaran Situasional (*Situational Awareness*)**:
   - Skema warna status fungsional: Hijau (Normal/Safe), Kuning (Waspada/Medium Risk), Merah Pulsa (Kritis/Breached).
   - Pembaruan dinamis *real-time ticker* untuk sisa SLA paket per detik tanpa jeda.

---

## 2. Arsitektur Direktori `src/`

```text
src/
├── assets/                  # Ikon SVG, gambar, dan aset grafis Anteraja
├── css/
│   ├── base/                # Reset CSS, variabel warna (design tokens), tipografi Inter
│   ├── components/          # Komponen UI: tombol, badge status, modal, kartu, drawer
│   ├── layout/              # Layout shell: sidebar, navbar atas, workspace container
│   └── pages/               # Styling spesifik tiap halaman modul
├── html/
│   ├── live-monitoring-map.html        # F01: Peta tracking live armada kurir
│   ├── sla-risk-indicator-panel.html   # F02: Panel kalkulasi & filter risiko SLA
│   ├── one-click-task-reassignment.html # F03: Alur matching & pengalihan tugas
│   └── quick-incident-reporting.html   # F04: Pelaporan insiden 3 ketukan & log
├── javascript/
│   ├── live-monitoring-map.js          # Skrip interaksi peta & telemetri
│   ├── sla-risk-indicator-panel.js     # Skrip dynamic countdown & filter SLA
│   ├── one-click-task-reassignment.js  # Skrip verifikasi kurir & one-click reassign
│   ├── quick-incident-reporting.js     # Skrip form insiden, file preview, & toast
│   └── login.js                        # Skrip validasi formulir login & auth flow
└── login.html                          # Halaman autentikasi Admin Staging Hub
```

Seluruh skrip JavaScript ditulis dengan pola **Modular IIFE (*Immediately Invoked Function Expression*)** yang terenkapsulasi bersih, bebas polusi variabel global, dan mengutamakan performa manipulasi DOM native.

---

## 3. Daftar Interaksi & Rincian Implementasi UX Per Modul

### 3.1. Modul Live Monitoring Map (F01)
* **File:** [`src/html/live-monitoring-map.html`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/html/live-monitoring-map.html) & [`src/javascript/live-monitoring-map.js`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/javascript/live-monitoring-map.js)
* **Tujuan UX:** Menyajikan visibilitas spasial posisi kurir SATRIA, tipe armada (Motor, Van, Kargo), dan status rantai dingin (*Cold-Chain Frozen/Pharma*) di area Jabodetabek.
* **Penggunaan Event:**
  - `click` pada SVG Map Marker / Kartu Kurir di list: Memicu pembukaan *Info Drawer* rincian kurir.
  - `click` pada tombol tutup drawer / tombol Batal: Menutup drawer secara mulus.
  - `keydown` (`Escape`): Menutup drawer aktif untuk mendukung kenyamanan navigasi keyboard.
  - `click` pada tombol filter armada: Memfilter marker armada di peta berdasarkan tipe layanan.
* **Manipulasi DOM:**
  - Memanipulasi `popup.style.display = 'flex'` dan atribut ARIA `popup.setAttribute('aria-hidden', 'false')`.
  - Mengupdate dataset root pada dokumen `document.body.dataset.mapState` dengan nilai state aktif (`popup-open`, `focus-route`).
  - Mengubah kelas elemen visual marker secara dinamis dengan penambahan animasi *pulse* merah ketika telemetri mendeteksi anomali suhu rantai dingin (`> 5°C`) atau sinyal *offline* (`> 15 detik`).

---

### 3.2. Modul SLA Risk Indicator Panel (F02)
* **File:** [`src/html/sla-risk-indicator-panel.html`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/html/sla-risk-indicator-panel.html) & [`src/javascript/sla-risk-indicator-panel.js`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/javascript/sla-risk-indicator-panel.js)
* **Tujuan UX:** Mencegah pelanggaran batas waktu pengiriman (*SLA Breached*) melalui dashboard pemantauan berprioritas warna dengan pencarian cepat resi.
* **Penggunaan Event:**
  - `input` pada kolom *Live Search*: Memicu pencarian reaktif dengan *debouncing* (200ms) untuk mencocokkan nomor resi (AWB) atau nama kurir.
  - `click` pada tab filter resiko (`Semua`, `Kritis/High Risk`, `Waspada/Medium Risk`, `Aman/Safe`): Mengisolasi tampilan baris paket sesuai tingkat urgensi.
  - `click` pada baris tabel resi: Membuka modal pop-up yang merinci formula kalkulasi sisa waktu dan toleransi cuaca.
  - `click` pada tombol aksi cepat *"Alihkan"*: Mengarahkan langsung ke proses reassign tanpa meninggalkan halaman.
* **Manipulasi DOM:**
  - Memanipulasi properti baris tabel `tr.style.display = ''` atau `'none'` berdasarkan kecocokan query pencarian dan tab filter aktif.
  - Menjalankan interval JavaScript (`setInterval`) yang memanipulasi elemen DOM `.countdown-timer` setiap 1000ms untuk memperbarui sisa menit pengiriman secara dinamis.
  - Mengubah kelas badge status resiko secara reaktif (`sla-badge--high`, `sla-badge--medium`, `sla-badge--safe`) dan teks label sisa waktu secara dinamis via `.textContent`.

---

### 3.3. Modul One-Click Task Reassignment (F03)
* **File:** [`src/html/one-click-task-reassignment.html`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/html/one-click-task-reassignment.html) & [`src/javascript/one-click-task-reassignment.js`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/javascript/one-click-task-reassignment.js)
* **Tujuan UX:** Memberikan solusi instan kepada admin ketika terjadi kendala fisik kurir (ban bocor, mogok, sakit) dengan sistem rekomendasi kurir cadangan terdekat yang kompatibel.
* **Penggunaan Event:**
  - `click` pada baris paket bermasalah: Membuka *Side Workspace Panel* dan menyorot baris paket yang dipilih.
  - `change` pada radio button kurir cadangan: Memicu algoritma validasi kompatibilitas (kapasitas paket tersisa < 20, kecocokan mobil box untuk kargo, tas pendingin untuk frozen, izin BPOM untuk pharma).
  - `click` pada tombol *"Konfirmasi Pengalihan Tugas"*: Menjalankan eksekusi pemindahan tugas.
* **Manipulasi DOM:**
  - Mengubah atribut workspace `workspace.setAttribute('data-active-panel', panelId)` untuk menampilkan panel konfigurasi kurir pengganti.
  - Mengaktifkan tombol eksekusi (`submitBtn.removeAttribute('disabled')`) hanya setelah validasi kurir terpenuhi.
  - Memperbarui DOM status baris tabel secara instan dari status `"Menunggu Penanganan"` menjadi `"Dialihkan ke [Nama Kurir]"` lengkap dengan perubahan kelas badge dari merah menjadi hijau sukses.
  - Memunculkan modal dialog sukses dengan animasi konfirmasi.

---

### 3.4. Modul Quick Incident Reporting (F04)
* **File:** [`src/html/quick-incident-reporting.html`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/html/quick-incident-reporting.html) & [`src/javascript/quick-incident-reporting.js`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/javascript/quick-incident-reporting.js)
* **Tujuan UX:** Memfasilitasi pelaporan insiden darurat lapangan hanya dengan 3 ketukan (*3-tap reporting*), meminimalkan waktu terbuang untuk pengetikan formulir yang rumit.
* **Penggunaan Event:**
  - `click` pada kartu opsi kategori kendala (Banjir, Mogok, Ban Bocor, Anomali Suhu, Segel Rusak): Memilih jenis insiden dengan selektor visual instan.
  - `change` pada input file gambar: Memproses unggahan foto bukti kendala.
  - `dragover` dan `drop` pada area dropzone: Mendukung unggah berkas fleksibel berbasis *drag-and-drop*.
  - `submit` pada formulir insiden: Mencegah reload halaman standar (`e.preventDefault()`) dan memicu proses verifikasi data.
* **Manipulasi DOM:**
  - Membaca file gambar menggunakan API `FileReader` dan menginjeksi elemen DOM kartu pratinjau foto (`<img class="qir-preview-img">`) lengkap dengan tombol hapus foto sebelum diunggah.
  - Menambahkan baris insiden baru ke tabel riwayat secara instan menggunakan `tableBody.insertAdjacentHTML('afterbegin', newRowHTML)` tanpa memuat ulang halaman.
  - Merender komponen *Floating Toast Notification* sukses secara dinamis ke pojok layar dan menghapusnya otomatis dari DOM (`toast.remove()`) setelah durasi 3 detik.

---

### 3.5. Modul Autentikasi Admin Hub (Login)
* **File:** [`src/login.html`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/login.html) & [`src/javascript/login.js`](file:///c:/maxy/anteraja-capstone-naufalrakanramadhan/src/javascript/login.js)
* **Tujuan UX:** Menyediakan alur login yang bersih, aman, meminimalkan salah ketik sandi, dan memberikan umpan balik langsung sebelum kredensial diproses.
* **Penggunaan Event:**
  - `click` pada tombol toggle mata: Menampilkan atau menyembunyikan karakter kata sandi.
  - `input` / `blur` pada input Email Hub dan Password: Menjalankan validasi format email dan syarat sandi secara instan.
  - `submit` pada form login: Menjalankan alur autentikasi lokal.
* **Manipulasi DOM:**
  - Mengubah atribut input secara reaktif: `passwordInput.type = (isPassword ? 'text' : 'password')` dan memperbarui ikon SVG mata terbuka/tertutup.
  - Menampilkan atau menghapus kelas CSS peringatan `.has-error` serta menyisipkan pesan error kontekstual pada elemen `.field-feedback`.
  - Memanipulasi teks dan status tombol submit menjadi status memuat (`button.disabled = true; button.innerHTML = '<span class="spinner"></span> Masuk...'`).
  - Mengalihkan halaman secara otomatis (`window.location.href = './html/live-monitoring-map.html'`) saat verifikasi kredensial berhasil.

---

## 4. Tabel Matriks Manipulasi DOM & Event Handling

| ID Interaksi | File JavaScript Terkait | Event Listener Utama | Objek Target DOM | Metode / Properti DOM yang Digunakan |
| :---: | :--- | :--- | :--- | :--- |
| **INT-01** | `live-monitoring-map.js` | `click`, `keydown` | `.courier-marker`, `#popup-courier-budi` | `style.display`, `classList.toggle`, `setAttribute('aria-hidden')` |
| **INT-02** | `sla-risk-indicator-panel.js` | `input`, `click` | `#sla-search-input`, `.sla-tab-btn` | `style.display`, `setInterval`, `textContent`, `classList.add/remove` |
| **INT-03** | `one-click-task-reassignment.js` | `click`, `change` | `.incident-row`, `.radio-courier-select` | `setAttribute('data-active-panel')`, `removeAttribute('disabled')`, `innerHTML` |
| **INT-04** | `quick-incident-reporting.js` | `submit`, `change`, `drop` | `#incident-form`, `#file-dropzone` | `FileReader.readAsDataURL`, `insertAdjacentHTML`, `Element.remove()` |
| **INT-05** | `login.js` | `submit`, `click`, `input` | `#login-form`, `#toggle-password-btn` | `input.type`, `classList.toggle('has-error')`, `button.disabled` |
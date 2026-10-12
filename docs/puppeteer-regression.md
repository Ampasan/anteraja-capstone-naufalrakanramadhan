# Dokumentasi Regression Test: Shipment Request

Dokumen ini menjelaskan automated end-to-end regression test untuk workflow
Shipment Request pada aplikasi Hub Dwell Monitor. Test dibangun dengan
Puppeteer dan bersifat data-driven, sehingga satu runner mengeksekusi banyak
scenario dari satu file JSON.

## Test Objective

Memastikan workflow penting Shipment Request tetap bekerja secara konsisten
setelah aplikasi berubah:

1. Form Shipment Request terbuka dan dapat diisi otomatis.
2. Submit form mengirim data ke server dan memperoleh respons.
3. Server menilai input sebagai `SUCCESS` atau `VALIDATION_ERROR` sesuai
   aturan validasi.
4. Shipment yang valid masuk ke Request History.
5. Shipment yang tidak valid ditolak, tidak masuk Request History, dan
   menampilkan pesan error pada field yang bersalah.

Penting untuk dipahami: PASS tidak berarti shipment berhasil disubmit.
Scenario negative juga PASS ketika aplikasi dengan benar menolak input yang
memang seharusnya tidak valid.

## Arsitektur Pengujian

Halaman Shipment Request diakses lewat route `#/shipment`. Form mengirim
`POST /api/shipments`, sebuah middleware Vite di `server/shipment-api.js`
yang berperan sebagai backend. Server memvalidasi input, mengembalikan kode
HTTP 201 untuk sukses atau 400 untuk validasi gagal, lalu menyimpan riwayat
yang dapat dibaca ulang lewat `GET /api/shipments`.

Pemisahan ini penting: validasi tidak hanya mengandalkan state React di
klien, sehingga test benar-benar menguji jalur form, jaringan, server, lalu
kembali ke tampilan.

Endpoint `DELETE /api/shipments` mengosongkan riwayat sebelum tiap scenario
dijalankan, agar hasil tetap sama setiap kali suite diulang.

## Selector yang Digunakan

Selector dipilih berdasarkan `id` dan atribut semantik agar stabil terhadap
perubahan CSS:

| Elemen | Selector |
| --- | --- |
| Tracking number | `#tracking-number` |
| Weight | `#weight` |
| Distance | `#distance` |
| Tombol submit | `button[type="submit"]` |
| Banner hasil | `#result-status` (dibaca attribute `data-status`) |
| Riwayat | `#request-history` dan `[data-tracking]` |
| Pesan error field | `#tracking-number-error`, `#weight-error`, `#distance-error` |

Menunggu halaman dilakukan dengan `waitForSelector` dan `waitForFunction`,
bukan dengan delay acak.

## Test Scenarios

Lima scenario berjalan dari `tests/shipment-test-data.json`:

| # | Scenario | Tipe | Input | Expected |
| --- | --- | --- | --- | --- |
| 1 | Normal Shipment | happy-path | ANT-001, 5 kg, 25 km | SUCCESS |
| 2 | Missing Tracking | negative | tracking kosong, 5 kg, 25 km | VALIDATION_ERROR |
| 3 | Invalid Weight | edge-case | ANT-003, -10 kg, 25 km | VALIDATION_ERROR |
| 4 | Long Distance Shipment | happy-path | ANT-004, 120.5 kg, 1500 km | SUCCESS |
| 5 | Zero Distance | edge-case | ANT-005, 5 kg, 0 km | VALIDATION_ERROR |

Scenario 4 menambah kasus bobot desimal dan jarak jauh untuk memastikan
validasi tidak salah menolak angka yang sah. Scenario 5 menguji batas bawah
jarak, yang berbeda dari scenario 3 yang menguji batas bawah bobot.

Menambah scenario baru cukup dengan menambah objek di file JSON. Tidak ada
perubahan pada script test.

## Expected vs Actual

Hasil aktual dari eksekusi terakhir:

| Scenario | Expected | Actual | HTTP | Status |
| --- | --- | --- | --- | --- |
| Normal Shipment | SUCCESS | SUCCESS | 201 | PASS |
| Missing Tracking | VALIDATION_ERROR | VALIDATION_ERROR | 400 | PASS |
| Invalid Weight | VALIDATION_ERROR | VALIDATION_ERROR | 400 | PASS |
| Long Distance Shipment | SUCCESS | SUCCESS | 201 | PASS |
| Zero Distance | VALIDATION_ERROR | VALIDATION_ERROR | 400 | PASS |

Setiap scenario dinilai dari beberapa check sekaligus, bukan hanya satu
nilai status:

- Expected vs actual status, dibaca dari attribute `data-status` pada
  `#result-status`.
- Kode HTTP respons server, 201 untuk sukses dan 400 untuk validasi gagal.
- Untuk yang SUCCESS: tracking number benar-benar muncul di Request History.
- Untuk yang VALIDATION_ERROR: field error yang dituju tampil, dan riwayat
  tetap kosong.
- Tidak ada exception JavaScript di browser.

## Cara Menjalankan

Pastikan aplikasi berjalan terlebih dahulu di terminal terpisah:

```bash
npm install
npm run dev
```

Lalu jalankan suite:

```bash
cd shipment-regression
npm install
npm test
```

Arahkan ke URL lain bila diperlukan dengan environment variable `APP_URL`,
misalnya `APP_URL=http://localhost:4173 npm test`.

Proses berakhir dengan kode keluar non-nol apabila ada scenario yang FAIL,
sehingga suite ini dapat langsung dipakai di pipeline CI.

## Evidence

Tiap scenario menghasilkan dua screenshot di `docs/automation-run/`: kondisi
form sebelum submit dan kondisi setelah hasil tampil.

```
docs/automation-run/
├── normal-shipment-form.png
├── normal-shipment-result.png
├── missing-tracking-form.png
├── missing-tracking-result.png
├── invalid-weight-form.png
├── invalid-weight-result.png
├── long-distance-form.png
├── long-distance-result.png
├── zero-distance-form.png
└── zero-distance-result.png
```

Screenshot adalah bukti visual, bukan dasar penilaian. PASS dan FAIL tetap
ditentukan oleh logika verifikasi di script. Bila sebuah scenario gagal,
script juga menyimpan screenshot tambahan bernama `<id>-failure.png` untuk
membantu diagnosis.

## Regression Result

Dari 5 scenario yang dijalankan: **5 PASS, 0 FAIL**.

Report lengkap per scenario tersimpan otomatis di `shipment-regression/test-results.json`
berisi expected, actual, status, detail tiap check, kode HTTP, dan jalur
screenshot. File ini ditulis ulang pada setiap eksekusi, bukan disusun
manual.

## Temuan Tambahan Selama Pengujian

Baseline manual sebelum otomasi (ANT-001, 5 kg, 25 km) mengonfirmasi
perilaku yang sama dengan hasil automation, sehingga ekspektasi test sudah
benar sejak awal.

Pemeriksaan view Monitor yang direfaktor menemukan satu bug yang sudah ada
sebelumnya: Daftar Hub menyusut hingga sekitar 2px sehingga isinya tidak
terbaca. Penyebabnya `.right-panel` adalah flex column dengan `max-height`
dan `overflow-y: auto`, sementara anak-anaknya memakai `flex-shrink` default
sehingga menyusut alih-alih panel menggulir. Diperbaiki dengan menetapkan
`flex-shrink: 0` pada anak panel. Setelah perbaikan Daftar Hub tampil penuh
sekitar 360px dengan 6 hub.

## Conclusion

Workflow Shipment Request sudah cukup stabil berdasarkan pengujian ini.
Kelima scenario, mencakup happy path, negative test, dan edge case, berjalan
sesuai harapan dengan verifikasi expected versus actual yang otomatis.

Keterbatasan yang perlu diketahui: backend berupa middleware dalam memori,
jadi riwayat hilang saat dev server dimuat ulang, dan validasi belum menguji
kasus seperti tracking number duplikat atau input berbasis teks pada field
angka. Suite ini dirancang untuk dijalankan ulang setelah perubahan aplikasi
sebagai penjaga agar workflow ini tidak rusak diam-diam.

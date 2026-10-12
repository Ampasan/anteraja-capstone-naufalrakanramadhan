# Shipment Regression Suite

Automated end-to-end regression test untuk workflow Shipment Request,
dibangun dengan Puppeteer dan bersifat data-driven.

Satu test runner membaca banyak scenario dari file JSON, mengisi form,
submit, memverifikasi expected versus actual, mengambil screenshot, lalu
menulis report PASS/FAIL.

## Struktur

```
shipment-regression/
├── tests/
│   ├── shipment-regression.js    # Test runner (sekali tulis, jalan banyak scenario)
│   └── shipment-test-data.json   # Dataset scenario
├── docs/
│   ├── puppeteer-regression.md   # Dokumentasi lengkap
│   └── automation-run/           # Screenshot evidence per scenario
├── test-results.json             # Report otomatis, ditulis ulang tiap run
└── package.json
```

Screenshot evidence tersimpan di `docs/automation-run/` di dalam folder ini.

## Prasyarat

Aplikasi harus berjalan terlebih dahulu, karena test membuka halaman asli
bukan mock:

```bash
# terminal 1, di root repo
npm install
npm run dev
```

## Menjalankan

```bash
# terminal 2
cd shipment-regression
npm install
npm test
```

Gunakan URL lain bila diperlukan:

```bash
APP_URL=http://localhost:4173 npm test
```

Proses berakhir dengan kode keluar non-nol apabila ada scenario yang FAIL,
sehingga cocok dipakai di pipeline CI.

## Menambah Scenario

Tambahkan objek baru ke array `scenarios` di
`tests/shipment-test-data.json`. Tidak perlu menyentuh script test.

```json
{
  "id": "non-numeric-weight",
  "name": "Non Numeric Weight",
  "type": "edge-case",
  "description": "Bobot berupa teks harus ditolak.",
  "input": {
    "trackingNumber": "ANT-006",
    "weight": "lima",
    "distance": "25"
  },
  "expect": {
    "status": "VALIDATION_ERROR",
    "errorField": "weight"
  }
}
```

Field `expect.status` menerima `SUCCESS` atau `VALIDATION_ERROR`.

- `SUCCESS` menuntut field tambahan `historyContains`, berisi tracking number
  yang wajib muncul di Request History.
- `VALIDATION_ERROR` menuntut field tambahan `errorField`, berisi id input
  yang error-nya harus tampil. Runner juga memverifikasi riwayat tetap kosong.

## Apa yang Diverifikasi

Per scenario ada beberapa check sekaligus:

1. Expected versus actual status, dibaca dari attribute `data-status` pada `#result-status`.
2. Kode HTTP respons server, 201 untuk sukses dan 400 untuk validasi gagal.
3. Untuk SUCCESS, tracking number masuk Request History.
4. Untuk VALIDATION_ERROR, field error yang dituju tampil dan riwayat tetap kosong.
5. Tidak ada exception JavaScript di browser.

## Selector

Runner memakai selector stabil berbasis `id`, bukan class styling:

`#tracking-number`, `#weight`, `#distance`, `button[type="submit"]`,
`#result-status`, `#request-history`, dan `#<field>-error`.

Menunggu halaman memakai `waitForSelector` dan `waitForFunction`, bukan
delay acak.

## Determinisme

Sebelum tiap scenario, runner memanggil `DELETE /api/shipments` untuk
mengosongkan riwayat di server. Karena itu suite dapat dijalankan berulang
tanpa hasil yang berubah-ubah.

## Dokumentasi Lengkap

Penjelasan objective, tabel scenario, hasil expected versus actual, evidence,
dan conclusion ada di `docs/puppeteer-regression.md` di dalam folder ini.

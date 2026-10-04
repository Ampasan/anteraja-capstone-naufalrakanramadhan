# Pengujian dan Performa

Dokumen ini mencakup seluruh pengujian aplikasi (backend dan frontend), hasil
run terakhir, bukti pengukuran performa sebelum dan sesudah optimasi, serta
cara mengulang pengukuran yang sama.

Ringkasan hasil terakhir:

| Lapisan | Jumlah test | Assertion | Status | Durasi |
| --- | ---: | ---: | --- | ---: |
| Backend (PHPUnit 11.5.56) | 174 | 979 | 0 gagal | 25,01 s |
| Frontend (Vitest 5.0.3 + Testing Library) | 176 | - | 0 gagal | 8,04 s |
| `npm run build` | - | - | exit 0 | 4,96 s |
| `npm run lint` | - | - | exit 0 | 6,0 s |

## Menjalankan pengujian

Dijalankan di PowerShell 5.1 (tidak mendukung `&&`, jadi perintah dipisah baris):

```powershell
# backend
php artisan test                          # semua suite: 174 test
php artisan test --testsuite=Unit         # 55 test
php artisan test --testsuite=Feature      # 114 test
php artisan test --testsuite=Performance  # 5 test, cetak tabel latency + query budget

# frontend
npm run test -- --run                     # 176 test
npm run build
npm run lint
```

Satu berkas atau satu test:

```powershell
php artisan test tests\Unit\SlaRiskServiceTest.php
php artisan test --filter test_reassign_moves_the_package
npm run test -- --run src\lib\__tests__\mappers.test.ts
```

## Lingkungan uji

Konfigurasi ada di `backend/phpunit.xml` dan `frontend/vitest.config.ts`.

| Aspek | Nilai saat test | Alasan |
| --- | --- | --- |
| Database | sqlite `:memory:` | tanpa server, tiap test mulai bersih |
| Cache | `CACHE_STORE=array` | hitung query stabil, tanpa Redis |
| Queue / session | `sync` / `array` | deterministik |
| `BCRYPT_ROUNDS` | 4 | hash password lebih ringan saat test, cabang logika login tetap sama |
| URL test | absolut `http://localhost/api/...` | helper Laravel menempelkan path `APP_URL` di depan URI relatif, sehingga `/` akan terbaca `/anteraja-capstone/backend/public` dan 404 |
| Token | token Sanctum sungguhan | `App\Models\User` tidak meng-extend `Authenticatable`, jadi `actingAs` tidak dipakai |
| Guard | `$this->app['auth']->forgetGuards()` di `TestCase::call()` | guard Sanctum menyimpan hasil resolve pertama dan tidak mereset diri antar request |
| Data | `tests/Performance/Fixtures/ScaleSeeder.php`, `tests/Support/SeedsHalim.php` | 40 kurir (37 IDLE), 300 order, 90 insiden (75 di hub Halim), 406 baris audit log |
| Frontend | jsdom, `vi.stubGlobal('fetch', ...)` | tanpa browser, tanpa server |

Catatan untuk pengukuran: `Cache::flush()` memicu middleware `Authenticate::markActiveHub`
yang menjalankan `cache:warm` secara sinkron, jadi pengukur memasang balik penanda
`active_hub:{id}` sebelum mengambil waktu (pola sama dengan
`tests/Performance/Concerns/MeasuresApiEndpoints.php`).

## Jenis pengujian

| Jenis | Lokasi | Jumlah | Yang dibuktikan |
| --- | --- | ---: | --- |
| Unit | `backend/tests/Unit` | 55 | logika murni: kalkulasi SLA, ranking risiko, kandidat kurir, format CSV, jam operasional, cache key |
| Feature / API | `backend/tests/Feature` | 114 | perilaku HTTP penuh lewat kernel Laravel: status code, envelope, isi respons, sisi efek (audit log, cache, relasi) |
| Auth & keamanan | `AuthTest` (7), `HealthAndSecurityTest` (41), `EnvelopeContractTest` (5), `CacheAndPerformanceGuardsTest` (3) | 56 | login benar/salah/nonaktif, 401 tanpa token dan token salah di 18 endpoint, 405, envelope error, header timing, larangan simpan respons di proxy |
| Performa | `backend/tests/Performance` | 5 | latensi dingin/hangat di bawah 1000 ms, pagu jumlah query per endpoint |
| Unit frontend | `frontend/src/**/__tests__/*.{ts,tsx}` | 108 | mapper API, klien HTTP, session, util, jam operasional, dan hook (`useAuth`, `useAuditLogs`, `useIncidentToast`) |
| Komponen frontend | `frontend/src/**/__tests__/*.test.tsx` | 68 | render, interaksi keyboard, validasi form, state kosong/error dengan Testing Library |

176 test berada di 19 berkas: 5 berkas test logika murni di `src/lib`,
3 berkas test hook, 10 berkas test komponen, dan 1 berkas uji keyboard lintas
komponen. Nilai per berkas ada di tabel inventaris.

## Inventaris backend (174 test)

### Unit (55 test, 11 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `SlaRiskServiceTest.php` | 7 | skor risiko, pita SLA, penalti cuaca, label warna, cache key |
| `TabelQueryTest.php` | 7 | filter terdaftar, paginasi, metadata halaman, total sebelum paginasi |
| `CourierReplacementServiceTest.php` | 6 | kompatibilitas armada, eksklusi, kapasitas, cuaca buruk, lencana kandidat |
| `CourierRouteTest.php` | 6 | loop rute, jari-jari, wrap sudut, titik awal |
| `DailyIncidentReportServiceTest.php` | 6 | kolom laporan, flatten, ringkasan, ekspor CSV |
| `OperationalClockTest.php` | 6 | jam beku, override konfigurasi, literal SQL UTC, konversi WIB |
| `CourierServiceTest.php` | 4 | jarak geografis (haversine-like) simetris dan berskala benar |
| `TaskTrackerTest.php` | 4 | terima task, update status, id bukan UUID |
| `AuditLogStockEvidenceTest.php` | 3 | foto bukti per kategori, fallback, pengecualian frozen |
| `IncidentSeverityTest.php` | 3 | severity kritis/warning, label status |
| `RiskRankingServiceTest.php` | 3 | skor per hub, urutan terbalik, parsing balasan Redis |

### Feature (114 test, 12 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `HealthAndSecurityTest.php` | 41 | ping, health, 18 endpoint tanpa token ditolak dan dengan token tidak gagal (data provider), 405, route publik |
| `IncidentTest.php` | 18 | daftar, create, validasi, reassign (7 penolakan: terlalu sering, kurir pengirim, melebihi kapasitas paket, paket selesai, armada tak cocok, kapasitas muatan kurang, id tak dikenal), export CSV/XLSX, upload bukti |
| `OrderTest.php` | 9 | sla-risk ringkas, scope panel satu baris per kurir idle, risiko teratas, tabel tugas: paginasi, pencarian, filter, version bump cache |
| `CourierTest.php` | 8 | daftar kurir aktif, kandidat (exclude, order tidak dikenal), detail/404, telemetri: validasi koordinat, simpan posisi, 404 |
| `AuthTest.php` | 7 | login benar/salah/password salah/email tidak ada/field kurang/akun nonaktif, `/auth/me`, logout mencabut token |
| `AuditLogTest.php` | 7 | index + KPI, urutan terbaru, bukti foto per status, export CSV/PDF, format tak dikenal, cakupan per hub |
| `TaskTest.php` | 6 | status task 202/200, id bukan UUID dan tidak ada |
| `DashboardTest.php` | 5 | ringkasan terseed, hub tanpa operasi nol, 404 hub hilang, 5 hub berposisi, payload cache identik |
| `EnvelopeContractTest.php` | 5 | envelope sukses, 201, 404, validasi, 401 |
| `ApiBasicsTest.php` | 4 | `health` semua sistem, `hubs` lima entri, endpoint terproteksi butuh token, envelope 404 rute tak dikenal |
| `CacheAndPerformanceGuardsTest.php` | 3 | payload identik pada panggilan berulang, header timing + query, `Cache-Control: no-store` |
| `ExampleTest.php` | 1 | halaman pembuka 200 |

### Performance (5 test, 2 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `EndpointLatencyTest.php` | 4 | halaman bawah 1000 ms dingin dan hangat, login di bawah 1000 ms, export CSV di skala |
| `QueryBudgetTest.php` | 1 | jumlah query per endpoint tidak melebihi pagu |

Detail suite performa memakai sqlite `:memory:` dengan fixture skala, anggaran
1000 ms per endpoint, dan pagu jumlah query (misal `GET /incidents` maksimal 7
query, `GET /audit-logs` maksimal 4).

## Inventaris frontend (176 test, 19 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `src/lib/__tests__/mappers.test.ts` | 40 | pemetaan DTO API ke tipe UI: kurir, order, insiden, audit |
| `src/lib/__tests__/api.test.ts` | 20 | envelope sukses/error, token Bearer, 401 + hapus sesi, cache TTL dan dedupe, `waitForTask` |
| `src/features/auth/hooks/__tests__/useAuth.test.ts` | 14 | login, sesi, hydrasi token, logout |
| `src/features/audit-logs/hooks/__tests__/useAuditLogs.test.ts` | 13 | query, paginasi, filter, refresh |
| `src/features/auth/components/__tests__/LoginForm.test.tsx` | 11 | render, input, submit, pesan error |
| `src/components/ui/__tests__/Button.test.tsx` | 9 | varian, disabled, aksi klik |
| `src/components/ui/__tests__/Badge.test.tsx` | 8 | varian status dan warna |
| `src/lib/__tests__/session.test.ts` | 8 | simpan/baca/hapus token, prioritas localStorage, profil rusak |
| `src/features/monitoring/components/__tests__/CourierList.test.tsx` | 7 | daftar kurir, filter, state kosong |
| `src/hooks/__tests__/useIncidentToast.test.ts` | 7 | toast insiden, antrean, auto dismiss |
| `src/__tests__/keyboard.test.tsx` | 5 | navigasi keyboard, fokus |
| `src/components/ui/__tests__/Modal.test.tsx` | 5 | buka/tutup, focus trap, ESC |
| `src/features/incidents/components/__tests__/IncidentList.test.tsx` | 5 | daftar insiden, aksi reassign |
| `src/features/audit-logs/components/__tests__/AuditTable.test.tsx` | 5 | baris, format tanggal, kosong |
| `src/features/sla-risk/components/__tests__/SlaTable.test.tsx` | 5 | urutan risiko, warna, aksi |
| `src/components/ui/__tests__/Input.test.tsx` | 4 | label, error, tipe input |
| `src/features/auth/components/__tests__/HubSelect.test.tsx` | 4 | pilihan hub, default |
| `src/lib/__tests__/utils.test.ts` | 4 | util `cn` dan kelas kondisional |
| `src/lib/__tests__/operationalClock.test.ts` | 2 | jam beku, `Date` baru tiap panggilan |

## Hasil performa

### Suite performa (run terakhir)

`php artisan test --testsuite=Performance` (5 test, 210 assertion, 5,88 s).

Latensi endpoint, median dalam ms (dingin berarti cache kosong):

| Endpoint | Dingin | Hangat | Query dingin | Query hangat |
| --- | ---: | ---: | ---: | ---: |
| `GET /api/ping` | 0,7 | 0,7 | 0 | 0 |
| `GET /api/hubs` | 1,3 | 0,8 | 1 | 0 |
| `GET /api/auth/me` | 1,6 | 2,1 | 3 | 2 |
| `GET /api/dashboard/summary` | 1,8 | 2,1 | 3 | 2 |
| `GET /api/couriers` | 70,8 | 3,3 | 5 | 2 |
| `GET /api/orders/sla-risk` | 86,5 | 3,9 | 4 | 2 |
| `GET /api/tugas/tabel` | 12,1 | 1,9 | 4 | 2 |
| `GET /api/incidents` | 126,5 | 2,1 | 7 | 2 |
| `GET /api/audit-logs` | 91,5 | 2,1 | 4 | 2 |
| `GET /api/risiko/teratas` | 1,9 | 1,9 | 2 | 2 |
| `POST /api/auth/login` | 4,4 | - | 4 | - |
| `GET /api/audit-logs/export?format=csv` | 6,7 | - | 3 | - |
| `GET /api/incidents/export?format=csv` | 2,9 | - | 3 | - |

Pagu query dari `QueryBudgetTest` (semua PASS): `ping` 0, `hubs` 1,
`auth/me` 3, `dashboard` 3, `couriers` 5, `candidates` 6, `sla-risk` 4,
`tugas` 4, `incidents` 7, `audit-logs` 4, `risiko` 2.

Latensi dingin turun dari baseline sebelum optimasi (median ms):
`incidents` 269,4 menjadi 126,5; `sla-risk` 107,3 menjadi 86,5;
`audit-logs` 97,0 menjadi 91,5; `couriers` 75,1 menjadi 70,8.
Selisih dua endpoint terakhir berada di rentang noise pengukuran (±30 ms),
jadi angka yang paling meyakinkan adalah A/B pada komponen yang dioptimasi.

### Bukti optimasi (input sama, proses sama)

Dua fungsi berat diukur sebelum dan sesudah refactor dengan assertion identik
di kedua sisi:

| Kasus | Sebelum | Sesudah | Selisih |
| --- | ---: | ---: | ---: |
| Kandidat kurir, 75 insiden x 37 kurir | 120,5-156,1 ms | 12,6-25,0 ms | 84-90% lebih cepat |
| Format 406 baris audit log | 29,7-50,1 ms | 8,1-13,1 ms | 73-75% lebih cepat |

Perubahan yang menghasilkan angka itu: potret atribut per objek kurir disimpan
di `WeakMap` (`CourierReplacementService::snapshot`) sehingga loop kandidat
satu pass tanpa query ORM berulang, kunci layanan dihitung sekali per kurir,
pengecualian berupa `array_fill_keys`, dan format ISO 8601 memakai
`App\Support\Iso8601` tanpa locale. `OperationalClock::now()` dimemo per kunci
konfigurasi, `AuditLogService` menghitung kunci hari sekali dan merangkum
audit dalam satu pass.

### Pengukuran di browser

Dilakukan terhadap build produksi lewat `npm run preview` (`http://localhost/anteraja-capstone/backend/public/api`), login admin hub Halim, data ScaleSeeder. Angka diambil dari
`performance.getEntriesByType('navigation' | 'resource')` dan panel network.

| Skenario | Hasil |
| --- | --- |
| Load pertama `/login` (dingin) | DCL 286 ms, load event 401 ms |
| Reload `/monitoring` (3 sampel) | DCL 74-80 ms, load 267-307 ms, request API terakhir selesai 242-291 ms |
| Navigasi SPA ke `/sla` | render instan, API panel selesai 312 ms |
| Navigasi SPA ke `/audit` | render instan, `audit-logs` selesai 279 ms |
| Navigasi SPA ke `/monitoring` | 3 API paralel selesai dalam 263 ms |
| Navigasi SPA ke `/incidents` | tanpa request baru, memakai data cache |
| API hangat (3 run per endpoint) | `hubs` 72-87 ms, `incidents` 200-225 ms, `audit-logs` 191-309 ms, `couriers` 209-242 ms, `sla-risk` 190-272 ms, `dashboard/summary` 196-381 ms |
| Login API | dingin pertama 1322 ms (warm-up Apache + PHP), hangat 846-872 ms |

Angka browser lebih besar dari angka suite karena dua faktor: jalur nyata
Apache ke Supabase pgsql (round trip remote ±170 ms per query) sementara suite
memakai sqlite `:memory:`, dan login menghitung bcrypt penuh (suite memakai
`BCRYPT_ROUNDS=4`). Seluruh pengukuran tetap di bawah 1 detik kecuali login
pertama yang sekali jalan saat proses Apache masih dingin.

### Mengulang pengukuran browser

1. `cd frontend` lalu `npm run preview` (port 4173).
2. Buka `http://localhost:4173/login`, login dengan admin hub Halim.
3. Baca `performance.getEntriesByType('navigation')[0]` untuk DCL dan load,
   `getEntriesByType('resource')` untuk durasi request API.
4. Reload halaman untuk skenario reset, klik menu untuk skenario navigasi SPA.
5. Untuk API murni, jalankan `fetch` berulang ke endpoint dari konsol
   dengan token di `sessionStorage.getItem('anteraja.token')`.

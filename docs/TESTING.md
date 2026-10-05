# Pengujian dan Performa

Dokumen ini mencakup seluruh pengujian aplikasi (backend dan frontend), hasil
run terakhir, bukti pengukuran performa sebelum dan sesudah optimasi, serta
cara mengulang pengukuran yang sama.

Ringkasan hasil terakhir:

| Lapisan | Jumlah test | Assertion | Status | Durasi |
| --- | ---: | ---: | --- | ---: |
| Backend (PHPUnit 11.5.56) | 178 | 998 | 0 gagal | 15,18 s |
| Frontend (Vitest 5.0.3 + Testing Library) | 209 | - | 0 gagal | 8,61 s |
| `npm run build` | - | - | exit 0 | 3,70 s |
| `npm run lint` | - | - | exit 0 (1 warning lama) | 5,89 s |

Dijalankan dengan `bootstrap/cache/config.php` (hasil `php artisan optimize`)
masih aktif — lihat [Lingkungan uji](#lingkungan-uji).

## Menjalankan pengujian

Dijalankan di PowerShell 5.1 (tidak mendukung `&&`, jadi perintah dipisah baris):

```powershell
# backend
php artisan test                          # semua suite: 178 test
php artisan test --testsuite=Unit         # 58 test
php artisan test --testsuite=Feature      # 115 test
php artisan test --testsuite=Performance  # 5 test, cetak tabel latency + query budget

# frontend
npm run test -- --run                     # 209 test
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

`php artisan optimize` (config/route/event/view cache) boleh ditinggalkan aktif
sebelum menjalankan suite: `backend/tests/TestCase.php::refreshApplication()`
memaksa ulang seluruh nilai uji yang biasanya datang dari `phpunit.xml` — sqlite
`:memory:`, cache `array`, queue `sync`, session `array`, broadcast `null`,
mail `array`, bcrypt 4 putaran, `APP_ENV=testing` — setelah cache konfigurasi
membekukan nilai `.env`. Tanpa paksaan itu, suite akan nyambung ke database
Supabase live dan memakai Redis/antrean produksi.

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
| Unit | `backend/tests/Unit` | 58 | logika murni: kalkulasi SLA, ranking risiko, kandidat kurir, format CSV, jam operasional, cache key |
| Feature / API | `backend/tests/Feature` | 115 | perilaku HTTP penuh lewat kernel Laravel: status code, envelope, isi respons, sisi efek (audit log, cache, relasi) |
| Auth & keamanan | `AuthTest` (7), `HealthAndSecurityTest` (41), `EnvelopeContractTest` (5), `CacheAndPerformanceGuardsTest` (3) | 56 | login benar/salah/nonaktif, 401 tanpa token dan token salah di 18 endpoint, 405, envelope error, header timing, larangan simpan respons di proxy |
| Performa | `backend/tests/Performance` | 5 | latensi dingin/hangat di bawah 1000 ms, pagu jumlah query per endpoint |
| Unit frontend | `frontend/src/**/__tests__/*.{ts,tsx}` | 133 | mapper API, klien HTTP, session, util, jam operasional, snap rute ke jaringan jalan, perjalanan kurir di klien, dan hook (`useAuth`, `useAuditLogs`, `useIncidentToast`) |
| Komponen frontend | `frontend/src/**/__tests__/*.test.tsx` | 76 | render, interaksi keyboard, validasi form, state kosong/error dengan Testing Library |

209 test berada di 22 berkas: 7 berkas test logika murni di `src/lib`,
3 berkas test hook, 11 berkas test komponen, dan 1 berkas uji keyboard lintas
komponen. Nilai per berkas ada di tabel inventaris.

## Inventaris backend (178 test)

### Unit (58 test, 11 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `SlaRiskServiceTest.php` | 7 | skor risiko, pita SLA, penalti cuaca, label warna, cache key |
| `TabelQueryTest.php` | 7 | filter terdaftar, paginasi, metadata halaman, total sebelum paginasi |
| `CourierReplacementServiceTest.php` | 6 | kompatibilitas armada, eksklusi, kapasitas, cuaca buruk, lencana kandidat |
| `CourierRouteTest.php` | 9 | loop rute, jari-jari, wrap sudut, titik awal, snap ke jaringan jalan, fallback saat routing mati |
| `DailyIncidentReportServiceTest.php` | 6 | kolom laporan, flatten, ringkasan, ekspor CSV |
| `OperationalClockTest.php` | 6 | jam beku, override konfigurasi, literal SQL UTC, konversi WIB |
| `CourierServiceTest.php` | 4 | jarak geografis (haversine-like) simetris dan berskala benar |
| `TaskTrackerTest.php` | 4 | terima task, update status, id bukan UUID |
| `AuditLogStockEvidenceTest.php` | 3 | foto bukti per kategori, fallback, pengecualian frozen |
| `IncidentSeverityTest.php` | 3 | severity kritis/warning, label status |
| `RiskRankingServiceTest.php` | 3 | skor per hub, urutan terbalik, parsing balasan Redis |

### Feature (115 test, 12 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `HealthAndSecurityTest.php` | 41 | ping, health, 18 endpoint tanpa token ditolak dan dengan token tidak gagal (data provider), 405, route publik |
| `IncidentTest.php` | 18 | daftar, create, validasi, reassign (7 penolakan: terlalu sering, kurir pengirim, melebihi kapasitas paket, paket selesai, armada tak cocok, kapasitas muatan kurang, id tak dikenal), export CSV/XLSX, upload bukti |
| `OrderTest.php` | 9 | sla-risk ringkas, scope panel satu baris per kurir idle, risiko teratas, tabel tugas: paginasi, pencarian, filter, version bump cache |
| `CourierTest.php` | 9 | daftar kurir aktif, kandidat (exclude, order tidak dikenal), detail/404, telemetri: validasi koordinat, simpan posisi, 404, simulasi posisi maju |
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

## Inventaris frontend (209 test, 22 berkas)

| Berkas | Test | Fokus |
| --- | ---: | --- |
| `src/lib/__tests__/mappers.test.ts` | 41 | pemetaan DTO API ke tipe UI: kurir, order, insiden, audit |
| `src/lib/__tests__/api.test.ts` | 25 | envelope sukses/error, token Bearer, 401 + hapus sesi, cache TTL dan dedupe, cache hangat lewat refresh, dorong hasil revalidasi latar, throttle tulis tahan-simpan, `waitForTask` |
| `src/features/auth/hooks/__tests__/useAuth.test.ts` | 14 | login, sesi, hydrasi token, logout |
| `src/features/audit-logs/hooks/__tests__/useAuditLogs.test.ts` | 13 | query, paginasi, filter, refresh |
| `src/features/auth/components/__tests__/LoginForm.test.tsx` | 11 | render, input, submit, pesan error |
| `src/lib/__tests__/courierJourney.test.ts` | 11 | titik awal per tab, haversine, jarak tempuh dan titik berhenti di drop |
| `src/components/ui/__tests__/Button.test.tsx` | 9 | varian, disabled, aksi klik |
| `src/components/ui/__tests__/Badge.test.tsx` | 8 | varian status dan warna |
| `src/lib/__tests__/roadRoute.test.ts` | 8 | bentuk URL OSRM, cache per sel, 429/NoRoute/jaringan putus jatuh ke garis lurus |
| `src/lib/__tests__/session.test.ts` | 8 | simpan/baca/hapus token, prioritas localStorage, profil rusak |
| `src/features/incidents/components/__tests__/IncidentList.test.tsx` | 8 | daftar insiden, aksi reassign, tautan telepon |
| `src/hooks/__tests__/useIncidentToast.test.ts` | 7 | toast insiden, antrean, auto dismiss |
| `src/features/monitoring/components/__tests__/CourierList.test.tsx` | 7 | daftar kurir, filter, state kosong |
| `src/features/audit-logs/components/__tests__/AuditTable.test.tsx` | 6 | baris, format tanggal, kosong |
| `src/features/sla-risk/components/__tests__/SlaTable.test.tsx` | 5 | urutan risiko, warna, aksi |
| `src/components/ui/__tests__/Modal.test.tsx` | 5 | buka/tutup, focus trap, ESC |
| `src/__tests__/keyboard.test.tsx` | 5 | navigasi keyboard, fokus |
| `src/lib/__tests__/utils.test.ts` | 4 | util `cn` dan kelas kondisional |
| `src/features/auth/components/__tests__/HubSelect.test.tsx` | 4 | pilihan hub, default |
| `src/components/ui/__tests__/Input.test.tsx` | 4 | label, error, tipe input |
| `src/features/incidents/components/__tests__/ReassignPanel.test.tsx` | 4 | panel kosong, tautan telepon, kunci konfirmasi |
| `src/lib/__tests__/operationalClock.test.ts` | 2 | jam beku, `Date` baru tiap panggilan |

## Hasil performa

### Suite performa (run terakhir)

`php artisan test --testsuite=Performance` (5 test, 210 assertion, 5,27 s).

Latensi endpoint, median dalam ms (dingin berarti cache kosong):

| Endpoint | Dingin | Hangat | Query dingin | Query hangat |
| --- | ---: | ---: | ---: | ---: |
| `GET /api/ping` | 0,9 | 1,0 | 0 | 0 |
| `GET /api/hubs` | 1,4 | 1,3 | 1 | 0 |
| `GET /api/auth/me` | 1,8 | 2,2 | 3 | 2 |
| `GET /api/dashboard/summary` | 2,3 | 1,8 | 3 | 2 |
| `GET /api/couriers` | 65,3 | 2,6 | 5 | 2 |
| `GET /api/orders/sla-risk` | 103,4 | 3,3 | 4 | 2 |
| `GET /api/tugas/tabel` | 11,7 | 1,8 | 4 | 2 |
| `GET /api/incidents` | 122,3 | 2,2 | 7 | 2 |
| `GET /api/audit-logs` | 80,5 | 2,8 | 4 | 2 |
| `GET /api/risiko/teratas` | 1,9 | 3,0 | 2 | 2 |
| `POST /api/auth/login` | 4,4 | - | 4 | - |
| `GET /api/audit-logs/export?format=csv` | 7,4 | - | 3 | - |
| `GET /api/incidents/export?format=csv` | 2,2 | - | 3 | - |

Pagu query dari `QueryBudgetTest` (semua PASS): `ping` 0, `hubs` 1,
`auth/me` 3, `dashboard` 3, `couriers` 5, `candidates` 6, `sla-risk` 4,
`tugas` 4, `incidents` 7, `audit-logs` 4, `risiko` 2.

Latensi dingin turun dari baseline sebelum optimasi (median ms):
`incidents` 269,4 menjadi 122,3; `sla-risk` 107,3 menjadi 103,4;
`audit-logs` 97,0 menjadi 80,5; `couriers` 75,1 menjadi 65,3.
Angka dingin berfluktuasi antar run (±30 ms), jadi angka yang paling
meyakinkan adalah A/B pada komponen yang dioptimasi; hangat semuanya di
bawah 10 ms.

### Bukti optimasi: cache konfigurasi (HTTP asli)

Diukur pada server nyata `php artisan serve --port=8123` terhadap `GET /api/ping`
40 request berurutan setelah 10 pemanasan, dibaca ulang dengan
`Invoke-WebRequest`, memakai cache Redis yang sama:

| Kondisi `backend/bootstrap/cache/` | Median | Rata-rata |
| --- | ---: | ---: |
| tanpa `config.php` | 31,5 ms | - |
| `routes-v7.php` + `events.php` saja | 32,3 ms | - |
| `config.php` (hasil `php artisan optimize`) | 18,7 ms | 20,7 ms |

Seluruh kemenangan datang dari `config:cache`: tanpa itu tiap request membangun
`config/*.php` dari `.env` lewat dotenv. `route:cache` dan `event:cache` tidak
memberi tambahan di ukuran ini. Yang diukur di sini boot aplikasi saja —
pekerjaan query database (±170 ms per round trip ke Supabase) tidak berubah.

Satu optimasi lain di jalur tiap request: `Authenticate::markActiveHub`
sebelumnya menjalankan dua round-trip Redis (`Cache::add` lalu
`Cache::get('active_hubs')`) untuk tiap request terautentikasi. Sekarang
`Cache::add` menjadi gerbang: satu round-trip, dan pembacaan/penulisan daftar
`active_hubs` plus penjadwalan `cache:warm` hanya terjadi tiap 120 detik per
hub. Di Redis lokal satu round-trip terukur `add` 0,45 ms / `get` 0,19 ms;
pada Redis jaringan (RTT 1-3 ms) penghematannya sebesar itu per request.

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

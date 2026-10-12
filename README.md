# Anteraja Hub Dwell Monitor

Aplikasi web operasional untuk memantau dwell time paket di hub Anteraja. Menggabungkan data analytics, AI validation, location intelligence, dan interactive map dalam satu workflow.

## Stack

- React + Vite
- Leaflet  (vanilla, tanpa react-leaflet untuk menghindari error re-initialization)
- Tailwind CSS (utility base)
- Plus Jakarta Sans (Google Fonts)

## Setup

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Struktur Proyek

```
hub-dwell-monitor/
├── public/
│   └── data/
│       ├── metrics.json       # Dwell time per hub
│       ├── locations.json     # Koordinat hub
│       └── ai-summary.json    # AI summary + test logs
├── server/
│   └── shipment-api.js        # Middleware Vite: API validasi + riwayat shipment
├── src/
│   ├── components/
│   │   ├── KpiCard.jsx        # Metric tile
│   │   ├── Top3Hubs.jsx       # Top 3 ranking
│   │   ├── HubList.jsx        # Searchable hub list
│   │   ├── HubMap.jsx         # Leaflet map
│   │   ├── HubDetail.jsx      # Detail panel
│   │   ├── AiInsight.jsx      # AI summary display
│   │   └── ShipmentRequest.jsx # Form shipment + request history
│   ├── hooks/
│   │   └── useHubData.js      # Data fetching & merging
│   ├── utils/
│   │   └── format.js          # Dwell time formatter
│   ├── App.jsx                # Routing, layout, shared state
│   ├── App.css                # Responsive layout CSS
│   └── index.css              # Global base styles
├── shipment-regression/       # Suite regression Puppeteer (data-driven)
│   ├── tests/
│   │   ├── shipment-regression.js
│   │   └── shipment-test-data.json
│   ├── docs/
│   │   ├── puppeteer-regression.md # Dokumentasi regression test
│   │   └── automation-run/         # Screenshot evidence per scenario
│   └── test-results.json      # Report otomatis per eksekusi
├── docs/
│   └── hub-dwell-monitor.md   # Dokumentasi lengkap
└── screenshots/
    ├── stitch-v1.png
    ├── stitch-v2.png
    ├── desktop.png
    └── mobile.png
```

## Fitur Utama

- **KPI Dashboard** — Total hub, kunjungan selesai, rata-rata dwell global, jumlah hub prioritas
- **Top 3 Hub** — Ranked berdasarkan nilai numerik mean dwell time
- **Leaflet Map** — Marker interaktif, popup detail, warna berdasarkan prioritas
- **Shared Filter** — Satu state filter mempengaruhi peta dan daftar sekaligus
- **Pencarian** — Cari hub berdasarkan nama atau hub_id
- **Hub Detail** — Semua metrics per hub dalam panel detail
- **Shipment Request** — Form permintaan shipment dengan validasi server-side dan Request History, di route `#/shipment`
- **Responsive** — Desktop 1440px (dua kolom) dan mobile 390px (bertumpuk)

## Regression Test

Workflow Shipment Request dijaga oleh automated end-to-end test berbasis
Puppeteer. Test bersifat data-driven: satu runner membaca banyak scenario
dari `shipment-regression/tests/shipment-test-data.json`.

```bash
# terminal 1
npm run dev

# terminal 2
cd shipment-regression
npm install
npm test
```

Detail objective, scenario, hasil, dan evidence ada di
[shipment-regression/docs/puppeteer-regression.md](shipment-regression/docs/puppeteer-regression.md).

## Threshold

Ambang 6 jam hanya digunakan sebagai aturan simulasi latihan, bukan SLA resmi Anteraja.

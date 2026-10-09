# Anteraja Hub Dwell Monitor

Aplikasi web operasional untuk memantau dwell time paket di hub Anteraja. Menggabungkan data analytics, AI validation, location intelligence, dan interactive map dalam satu workflow.

## Stack

- React 19 + Vite 8
- Leaflet 1.9 (vanilla, tanpa react-leaflet untuk menghindari error re-initialization)
- Tailwind CSS 3 (utility base)
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
├── src/
│   ├── components/
│   │   ├── KpiCard.jsx        # Metric tile
│   │   ├── Top3Hubs.jsx       # Top 3 ranking
│   │   ├── HubList.jsx        # Searchable hub list
│   │   ├── HubMap.jsx         # Leaflet map
│   │   ├── HubDetail.jsx      # Detail panel
│   │   └── AiInsight.jsx      # AI summary display
│   ├── hooks/
│   │   └── useHubData.js      # Data fetching & merging
│   ├── utils/
│   │   └── format.js          # Dwell time formatter
│   ├── App.jsx                # Main layout + shared state
│   ├── App.css                # Responsive layout CSS
│   └── index.css              # Global base styles
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
- **Responsive** — Desktop 1440px (dua kolom) dan mobile 390px (bertumpuk)

## Threshold

Ambang 6 jam hanya digunakan sebagai aturan simulasi latihan, bukan SLA resmi Anteraja.

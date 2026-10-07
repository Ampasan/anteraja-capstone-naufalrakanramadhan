# Big Data Bottleneck Analysis - Scan Events

## 1. Dataset & Schema
Dataset `scan_events` mensimulasikan data logistik pelacakan paket (package tracking) dengan struktur kolom:
- `hub_id` (String): ID lokasi hub tempat scan dilakukan.
- `package_id` (String): ID unik dari paket yang dikirim.
- `event_type` (String): Jenis scan event, yaitu `ARRIVAL` (paket masuk hub) atau `DEPARTURE` (paket keluar hub).
- `timestamp` (Timestamp): Waktu terjadinya event scan.

## 2. Data Quality Check
Melalui analisis kualitas data yang komprehensif, ditemukan beberapa isu anomali dalam perekaman scan:
- **Duplicate Scan**: Ditemukan event scan ganda pada kombinasi kunci yang sama, dieliminasi menggunakan penanganan `dropDuplicates`.
- **Missing ARRIVAL**: Terdapat paket yang hanya merekam event `DEPARTURE` saja.
- **Missing DEPARTURE**: Paket yang masuk hub tetapi tidak pernah tercatat keluar.
- **Invalid Sequence (DEPARTURE < ARRIVAL)**: Paket yang tercatat keluar sebelum waktu kedatangannya.

Hanya data dengan pasangan ARRIVAL -> DEPARTURE yang lengkap dan berurutan secara logis yang digunakan untuk analisis lanjutan.

## 3. Hasil Perhitungan Dwell Time & Hub Aggregation
Hasil agregasi performa hub diurutkan berdasarkan `avg_dwell_hours` tertinggi:

| hub_id   |   package_count |   avg_dwell_hours |   median_dwell_hours |
|:---------|----------------:|------------------:|---------------------:|
| HUB_MKS  |            1492 |             17.89 |                12.68 |
| HUB_MES  |            1569 |             11.48 |                 7.87 |
| HUB_BDG  |            1482 |              4.01 |                 2.77 |
| HUB_JKT  |            1440 |              3.96 |                 2.68 |
| HUB_SRG  |            1476 |              3.91 |                 2.69 |
| HUB_SUB  |            1426 |              3.83 |                 2.75 |

## 4. Business Insight & Rekomendasi Investigasi

Based on the analysis, **HUB_MKS** menunjukkan bottleneck terbesar dengan average dwell time mencapai **17.89 jam** dan median sebesar **12.68 jam**, memproses total **1492 paket**. Angka ini jauh melebihi rata-rata standar operational level agreement (SLA) hub normal yang umumnya berada di bawah 5 jam. 

Hal menarik lainnya adalah **HUB_MES** menempati posisi kedua dengan average dwell time **11.48 jam**. Meskipun memiliki dwell time yang tinggi, tim operasional harus memprioritaskan investigasi pada **HUB_MKS** terlebih dahulu karena tingginya akumulasi volume paket yang tertahan di sana.

### Rekomendasi Langkah Investigasi bagi Tim Operasional:
1. **Audit Alur Kerja Sortir**: Memeriksa kapasitas mesin penyortir (*sorting machine*) dan tata letak penempatan barang di **HUB_MKS**.
2. **Evaluasi Penjadwalan Kurir/Armada**: Memastikan ketersediaan armada transportasi saat puncak kedatangan paket (peak arrival times).
3. **Analisis Shift Kerja**: Melakukan pengecekan produktivitas staf operasional selama jam-jam padat untuk menghindari penumpukan antrean.

# Shipment Delivery Analysis

Analisis data pengiriman paket: pembersihan data, statistik keterlambatan, visualisasi performa kurir, korelasi, dan prediksi dengan Linear Regression.

## Requirements

- Python
- pandas, numpy, matplotlib, scikit-learn

## Setup

```bash
pip install pandas numpy matplotlib scikit-learn
```

## Cara Menjalankan

### Google Colab (disarankan)

1. Buka [Google Colab](https://colab.research.google.com)
2. Upload `shipment-delivery-analysis.ipynb`
3. Upload `shipments.csv` ke file storage
4. Jalankan `Runtime > Run all`

### Jupyter Notebook lokal

```bash
jupyter notebook shipment-delivery-analysis.ipynb
```

## Struktur Proyek

```
python-delivery-analysis/
├── shipments.csv                      # Dataset mentah (220 baris, 7 kolom)
├── shipment-delivery-analysis.ipynb  # Notebook analisis lengkap
└── README.md                          # File ini
```

## Isi Notebook

| Bagian | Konten |
|--------|--------|
| 1 | Memuat data, cek shape, info, nilai kosong, duplikat |
| 2 | Pembersihan (tipe numerik, dropna, drop_duplicates), kolom `delay_hours`, statistik NumPy |
| 3 | Grouping manual vs `groupby()`, bar chart per kurir, korelasi jarak & berat |
| 4 | Train/test split, Linear Regression, evaluasi, komparasi rute jauh vs dekat, insight bisnis |
| 5 | Validasi akhir (semua kriteria penilaian) |

## Hasil Analisis

- **Data bersih**: 220 baris, 0 nilai kosong, 0 duplikat
- **Statistik delay**: min 0.00, median 3.05, mean 4.14, std 3.81 jam
- **Kurir terburuk**: Citra (rata-rata 7.90 jam), terbaik: Dedi (1.60 jam)
- **Korelasi**: `distance_km` r = 0.71 (kuat), `weight_kg` r = 0.22 (lemah)
- **Model**: R2 = 0.524, MAE = 1.102 jam (61.8% lebih baik dari baseline)
- **Insight**: Pengiriman >50 km terlambat >2 jam pada 100% kiriman (24/24), 10.8x lebih sering daripada <10 km (9.3%, 5/54)

## Dataset

`shipments.csv` berisi 220 baris data pengiriman dengan kolom:

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `tracking_number` | string | Nomor resi unik |
| `courier` | string | Nama kurir (Andi, Budi, Citra, Dedi, Sari) |
| `weight_kg` | float | Berat paket dalam kg |
| `distance_km` | float | Jarak tempuh dalam km |
| `promised_hours` | int | Janji waktu pengiriman (jam) |
| `actual_hours` | float | Waktu aktual pengiriman (jam) |
| `delay_hours` | float | Keterlambatan (jam) |

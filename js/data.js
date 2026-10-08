export const HUB = { lat: -6.2332, lng: 106.9040 };

export const STATUS = {
  delivered: { label: "Delivered",          color: "#16a34a", bg: "#dcfce7" },
  transit:   { label: "In Transit",         color: "#2563eb", bg: "#dbeafe" },
  pickup:    { label: "Pickup",             color: "#d97706", bg: "#fef3c7" },
  attempted: { label: "Attempted Delivery", color: "#dc2626", bg: "#fee2e2" },
  hub:       { label: "Hub (Geocoded)",     color: "#7c3aed", bg: "#ede9fe" },
};

export const shipments = [
  {
    trackingNumber: "ANJ-00001",
    courierName:    "Budi Santoso",
    status:         "delivered",
    destination:    "Jl. Cipinang Muara, Jatinegara, Jakarta Timur",
    lat: -6.2156, lng: 106.8874,
    eta: "08 Okt 2026, 10:30",
    weight: "2.5 kg",
  },
  {
    trackingNumber: "ANJ-00002",
    courierName:    "Dewi Rahayu",
    status:         "transit",
    destination:    "Jl. Pondok Kopi, Duren Sawit, Jakarta Timur",
    lat: -6.2491, lng: 106.9312,
    eta: "08 Okt 2026, 13:00",
    weight: "1.2 kg",
  },
  {
    trackingNumber: "ANJ-00003",
    courierName:    "Ahmad Fauzi",
    status:         "pickup",
    destination:    "Jl. Kramat Jati, Kramat Jati, Jakarta Timur",
    lat: -6.2513, lng: 106.8720,
    eta: "08 Okt 2026, 14:45",
    weight: "3.8 kg",
  },
  {
    trackingNumber: "ANJ-00004",
    courierName:    "Siti Nurhaliza",
    status:         "attempted",
    destination:    "Jl. Raya Kalimalang, Duren Sawit, Jakarta Timur",
    lat: -6.2438, lng: 106.9178,
    eta: "08 Okt 2026, 09:15",
    weight: "0.9 kg",
  },
  {
    trackingNumber: "ANJ-00005",
    courierName:    "Rizky Pratama",
    status:         "transit",
    destination:    "Jl. Condet Raya, Kramat Jati, Jakarta Timur",
    lat: -6.2640, lng: 106.8794,
    eta: "08 Okt 2026, 11:00",
    weight: "5.0 kg",
  },
  {
    trackingNumber: "ANJ-00006",
    courierName:    "Lina Kusuma",
    status:         "hub",
    destination:    "Graha Intirub Gate 46, Makasar, Jakarta Timur",
    address:        "Graha Intirub, Jalan Raya Bogor, Kecamatan Makasar, Jakarta Timur",
    eta: "08 Okt 2026, 08:00",
    weight: "7.3 kg",
  },
];

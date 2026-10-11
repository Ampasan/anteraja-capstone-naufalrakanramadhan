CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

TRUNCATE TABLE reassignment_confirmations, incident_evidences, incident_reports, courier_telemetries, audit_logs, orders, couriers, users, hubs CASCADE;

-- ============================================================================
-- 1. SEED: hubs
-- ============================================================================
INSERT INTO hubs (hub_code, hub_name, city, latitude, longitude, service_radius_km, max_capacity_parcels, current_parcels_count)
VALUES
    ('HUB-JAKTIM-HALIM', 'Hub Halim - Jakarta Timur', 'Jakarta Timur', -6.2651893, 106.8767953, 5.0, 2850, 2410),
    ('HUB-BDG-BATUNUNGGAL', 'Hub Batununggal - Bandung', 'Bandung', -6.9538120, 107.6274190, 4.0, 2500, 1820),
    ('HUB-BKS-HARAPANINDAH', 'Hub Harapan Indah - Bekasi', 'Bekasi', -6.1802150, 106.9842110, 7.0, 2200, 1450),
    ('HUB-JAKBAR-KEBONJERUK', 'Hub Kebon Jeruk - Jakarta Barat', 'Jakarta Barat', -6.1895120, 106.7699410, 5.0, 3000, 2600),
    ('HUB-JAKUT-SUNTER', 'Hub Sunter - Jakarta Utara', 'Jakarta Utara', -6.1384720, 106.8654190, 6.0, 2400, 1900);

-- ============================================================================
-- 2. SEED: users (Hub Halim)
-- Password default: Anteraja2026!
-- ============================================================================
INSERT INTO users (hub_id, name, email, password_hash, role, status)
VALUES
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Siti Rahmawati', 'siti.admin@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE'),
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Reza Bramantyo', 'reza.bramantyo@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE'),
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Dewi Lestari', 'dewi.cc@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE');

-- ============================================================================
-- 3. SEED: couriers (Hub Halim)
-- ============================================================================
INSERT INTO couriers (
    courier_code, hub_id, name, phone_number, license_plate, vehicle_type, status,
    current_parcel_count, max_parcel_count, current_load_kg, max_capacity_kg, current_address,
    is_bpom_certified, has_thermal_box
)
VALUES
    ('HLM-001', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Budi Santoso', '087723305893', 'B 3481 HLM', 'Motorcycle', 'ONLINE',
     12, 20, 24.50, 50.00, 'Jl. Cililitan Besar No. 5, Kramat Jati, Jakarta Timur', TRUE, TRUE),
    ('HLM-010', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Teguh Wibowo', '087723305893', 'B 9281 HLM', 'Truk', 'IDLE',
     5, 20, 186.80, 2000.00, 'Jl. Pondok Kopi Raya No. 12, Pondok Kopi, Jakarta Timur', FALSE, FALSE),
    ('HLM-004', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Fajar Ramadhan', '087723305893', 'B 9282 HLM', 'Van', 'ONLINE',
     8, 20, 400.00, 1200.00, 'Jl. Halim Perdanakusuma No. 8, Makasar, Jakarta Timur', TRUE, TRUE),
    ('HLM-005', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Ahmad Fauzi', '087723305893', 'B 9112 HLM', 'Truk Box', 'IDLE',
     4, 20, 500.00, 2000.00, 'Jl. Condet Raya No. 30, Kramat Jati, Jakarta Timur', FALSE, FALSE),
    ('HLM-008', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Rizky Pratama', '087723305893', 'B 6214 HLM', 'Motorcycle thermal box', 'ONLINE',
     9, 20, 18.20, 40.00, 'Jl. Condet Raya No. 18, Kramat Jati, Jakarta Timur', TRUE, TRUE),
    ('HLM-009', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Rama Pratama', '087723305893', 'B 4118 HLM', 'Motorcycle', 'IDLE',
     9, 20, 15.00, 40.00, 'Jl. Jatinegara Kaum No. 88, Jatinegara, Jakarta Timur', FALSE, FALSE),
    ('HLM-002', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Indra Gunawan', '087723305893', 'B 5512 HLM', 'Blind Van', 'IDLE',
     9, 20, 35.00, 800.00, 'Jl. Buaran Raya No. 14, Duren Sawit, Jakarta Timur', FALSE, FALSE),
    ('HLM-003', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Eko Prasetyo', '087723305893', 'B 6719 HLM', 'Pick Up Box', 'IDLE',
     10, 20, 45.00, 1000.00, 'Jl. Kampung Melayu Besar No. 9, Tebet, Jakarta Selatan', FALSE, FALSE),
    ('HLM-011', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Andi Wijaya', '087723305893', 'B 1234 HLM', 'Motorcycle', 'IDLE',
     3, 20, 3.00, 15.00, 'Jl. Ir. H. Djuanda, Cawang, Jakarta Timur', TRUE, FALSE),
    ('HLM-006', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Dedi Kurniawan', '087723305893', 'B 7788 HLM', 'Motorcycle', 'OFFLINE',
     0, 20, 0.00, 50.00, 'Jl. Raya Bekasi No. 100, Jakarta Timur', FALSE, FALSE),
    ('HLM-007', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Bayu Nugroho', '087723305893', 'B 9900 HLM', 'Motor Listrik', 'IDLE',
     1, 20, 1.60, 50.00, 'Jl. Pendidikan No. 20, Jakarta Timur', FALSE, FALSE);

-- ============================================================================
-- 4. SEED: courier_telemetries
-- ============================================================================
-- Telemetri kurir ONLINE
INSERT INTO courier_telemetries (courier_id, latitude, longitude, speed_kmh, temperature_c, battery_level, recorded_at)
VALUES
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-001'), -6.2678, 106.8812, 45.00, 3.1, 92, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-004'), -6.2622, 106.8802, 40.00, 2.4, 85, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-008'), -6.2712, 106.8838, 36.00, 6.2, 74, NOW());

-- Telemetri kurir IDLE
INSERT INTO courier_telemetries (courier_id, latitude, longitude, speed_kmh, temperature_c, battery_level, recorded_at)
VALUES
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-010'), -6.2650, 106.8770, 30.00, NULL, 48, NOW() - INTERVAL '8 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-005'), -6.2680, 106.8790, 30.00, NULL, 61, NOW() - INTERVAL '23 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-009'), -6.2600, 106.8750, 44.00, NULL, 65, NOW() - INTERVAL '47 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-011'), -6.2640, 106.8780, 42.00, NULL, 77, NOW() - INTERVAL '1 hour 4 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-002'), -6.2660, 106.8800, 34.00, NULL, 55, NOW() - INTERVAL '2 hours 12 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-003'), -6.2670, 106.8820, 36.00, NULL, 39, NOW() - INTERVAL '5 hours 36 minutes'),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-007'), -6.2655, 106.8760, 38.00, NULL, 58, NOW() - INTERVAL '38 minutes');

-- ============================================================================
-- 5. SEED: orders (Hub Halim - 22 IN_TRANSIT, 3 DELIVERED)
-- ============================================================================
INSERT INTO orders (
    order_number, hub_origin_id, current_courier_id, service_type, category,
    weight_kg, recipient_name, recipient_phone, destination_address, destination_district, destination_city,
    drop_latitude, drop_longitude, order_time, pickup_time, sla_deadline,
    weather_condition, traffic_condition, temperature_c, delivery_status
)
VALUES
    -- Budi Santoso (HLM-001, ONLINE)
    ('100024000000', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-001'),
     'Same Day', 'Snack & Makanan', 1.40, 'Ibu Ratna', '081298765403', 'Jl. Gatot Subroto Kav. 22', 'Kramat Jati', 'Jakarta Timur',
     -6.2610, 106.8695, NOW() - INTERVAL '180 minutes', NOW() - INTERVAL '153 minutes', NOW() + INTERVAL '9 minutes',
     'Cerah', 'Sedang', NULL, 'IN_TRANSIT'),
    ('100024000008', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-001'),
     'Instant', 'Dokumen Mendesak', 0.80, 'Bpk. Hendra', '081298765404', 'Jl. Ir. H. Djuanda No. 120', 'Cawang', 'Jakarta Timur',
     -6.2432, 106.8640, NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '102 minutes', NOW() - INTERVAL '14 minutes',
     'Hujan lebat', 'macet', NULL, 'IN_TRANSIT'),
    ('100024000411', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-001'),
     'PHARMA', 'Vaksin & Obat Resep', 2.10, 'RS Islam Jakarta Timur', '081298765407', 'Jl. Jatinegara Barat No. 126', 'Jatinegara', 'Jakarta Timur',
     -6.2488, 106.9012, NOW() - INTERVAL '300 minutes', NOW() - INTERVAL '255 minutes', NOW() + INTERVAL '48 minutes',
     'Berawan', 'Cawang Padat', 18.5, 'IN_TRANSIT'),
    ('100024000501', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-001'),
     'Same Day', 'Pakaian & Mode', 2.30, 'Sdri. Anisa', '081298765411', 'Jl. Pahlawan Revolusi No. 55', 'Pondok Bambu', 'Jakarta Timur',
     -6.2405, 106.9130, NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '102 minutes', NOW() + INTERVAL '132 minutes',
     'Cerah', 'Lancar', NULL, 'IN_TRANSIT'),
    ('100024000502', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-001'),
     'Instant', 'Elektronik Kecil', 1.10, 'Bpk. Yudi', '081298765412', 'Jl. Dewi Sartika No. 88', 'Cawang', 'Jakarta Timur',
     -6.2470, 106.8620, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '76 minutes', NOW() + INTERVAL '26 minutes',
     'Hujan Ringan', 'Padat', NULL, 'IN_TRANSIT'),

    -- Fajar Ramadhan (HLM-004, ONLINE)
    ('100024000529', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-004'),
     'Cargo', 'Elektronik Rumah Tangga', 75.00, 'Toko Jaya Makmur', '081298765408', 'Jl. Pondok Kopi Raya No. 12', 'Pondok Kopi', 'Jakarta Timur',
     -6.2172, 106.9248, NOW() - INTERVAL '300 minutes', NOW() - INTERVAL '255 minutes', NOW() + INTERVAL '210 minutes',
     'Normal Cerah', 'Lancar', NULL, 'IN_TRANSIT'),
    ('100024000530', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-004'),
     'Cargo', 'Bahan Bangunan', 120.00, 'PT Bangun Jaya', '081298765413', 'Jl. Raya Bekasi KM 18', 'Pulogadung', 'Jakarta Timur',
     -6.1880, 106.9060, NOW() - INTERVAL '240 minutes', NOW() - INTERVAL '204 minutes', NOW() + INTERVAL '74 minutes',
     'Cerah', 'Sedang', NULL, 'IN_TRANSIT'),
    ('100024000531', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-004'),
     'Same Day', 'Berkas Notaris', 3.40, 'Kantor Notaris Dian', '081298765414', 'Jl. Pramuka Raya No. 40', 'Pulo Gadung', 'Jakarta Timur',
     -6.1905, 106.8780, NOW() - INTERVAL '200 minutes', NOW() - INTERVAL '170 minutes', NOW() + INTERVAL '13 minutes',
     'Hujan Ringan', 'Padat', NULL, 'IN_TRANSIT'),
    ('100024000544', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-004'),
     'Cargo', 'Semen & Cat', 150.00, 'UD Bangun Rumah', '081298765424', 'Jl. Pulo Mas Raya No. 3', 'Pulo Mas', 'Jakarta Timur',
     -6.1870, 106.9150, NOW() - INTERVAL '260 minutes', NOW() - INTERVAL '221 minutes', NOW() - INTERVAL '6 minutes',
     'Hujan lebat', 'Macet Total', NULL, 'IN_TRANSIT'),

    -- Rizky Pratama (HLM-008, ONLINE) - rantai dingin
    ('100024000009', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-008'),
     'Frozen', 'Frozen Food & Daging', 4.50, 'Resto Daging Sedap', '081298765402', 'Jl. Condet Raya No. 18', 'Kramat Jati', 'Jakarta Timur',
     -6.2748, 106.8870, NOW() - INTERVAL '170 minutes', NOW() - INTERVAL '144 minutes', NOW() + INTERVAL '11 minutes',
     'Berawan', 'Padat', 6.2, 'IN_TRANSIT'),
    ('100024000108', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-008'),
     'Frozen', 'Ikan Salmon Segar', 3.20, 'Ibu Maya', '081298765405', 'Jl. Cipinang Muara No. 42', 'Cipinang Muara', 'Jakarta Timur',
     -6.2318, 106.9015, NOW() - INTERVAL '240 minutes', NOW() - INTERVAL '204 minutes', NOW() + INTERVAL '126 minutes',
     'Cerah', 'Lancar', 3.8, 'IN_TRANSIT'),
    ('100024000533', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-008'),
     'Frozen', 'Es Krim Premium', 6.00, 'Kafe Ceria', '081298765415', 'Jl. Kalimalang Raya No. 7', 'Pondok Kelapa', 'Jakarta Timur',
     -6.2300, 106.9210, NOW() - INTERVAL '150 minutes', NOW() - INTERVAL '127 minutes', NOW() + INTERVAL '37 minutes',
     'Berawan', 'Padat', 2.6, 'DELIVERED'),

    -- Teguh Wibowo (HLM-010, IDLE)
    ('100024000012', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-010'),
     'Cargo', 'Peralatan Pabrik', 186.80, 'PT Sentosa Abadi', '081298765401', 'Jl. Bekasi Timur Raya No. 9', 'Pulogadung', 'Jakarta Timur',
     -6.1900, 106.9210, NOW() - INTERVAL '350 minutes', NOW() - INTERVAL '297 minutes', NOW() + INTERVAL '245 minutes',
     'Cerah', 'Macet Total', NULL, 'DELIVERED'),
    ('100024000534', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-010'),
     'Cargo', 'Meubelair', 240.00, 'Toko Furnitur Indah', '081298765416', 'Jl. Majapahit No. 22', 'Jatinegara', 'Jakarta Timur',
     -6.2350, 106.8930, NOW() - INTERVAL '360 minutes', NOW() - INTERVAL '306 minutes', NOW() + INTERVAL '96 minutes',
     'Cerah', 'Sedang', NULL, 'IN_TRANSIT'),

    -- Ahmad Fauzi (HLM-005, IDLE)
    ('100024000535', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-005'),
     'Cargo', 'Drum Kimia', 300.00, 'PT Kimia Nusantara', '081298765417', 'Jl. Pulo Gadung Raya No. 5', 'Pulo Gadung', 'Jakarta Timur',
     -6.1750, 106.9000, NOW() - INTERVAL '300 minutes', NOW() - INTERVAL '255 minutes', NOW() + INTERVAL '168 minutes',
     'Hujan Lebat', 'Macet Parah', NULL, 'DELIVERED'),
    ('100024000536', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-005'),
     'Same Day', 'Dokumen Perusahaan', 2.00, 'PT Cipta Media', '081298765418', 'Jl. Casablanca Raya No. 100', 'Tebet', 'Jakarta Timur',
     -6.2400, 106.8450, NOW() - INTERVAL '180 minutes', NOW() - INTERVAL '153 minutes', NOW() + INTERVAL '54 minutes',
     'Hujan Ringan', 'Padat', NULL, 'IN_TRANSIT'),

    -- Rama Pratama (HLM-009, IDLE)
    ('100024000254', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-009'),
     'Same Day', 'Pakaian & Mode', 1.90, 'Sdri. Cindy', '081298765406', 'Jl. Buaran Raya No. 88', 'Duren Sawit', 'Jakarta Timur',
     -6.2215, 106.9088, NOW() - INTERVAL '340 minutes', NOW() - INTERVAL '289 minutes', NOW() + INTERVAL '188 minutes',
     'Hujan Ringan', 'Sedang', NULL, 'IN_TRANSIT'),
    -- Insiden INC-HLM-085 (banjir) belum pernah dialihkan, jadi kiriman ini
    -- masih di tangan Rama Pratama dan masih berjalan.
    ('100024000540', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-009'),
     'Same Day', 'Buku & Alat Tulis', 5.50, 'Toko Warga', '081298765422', 'Jl. Tebet Barat Dalam Raya', 'Tebet', 'Jakarta Timur',
     -6.2430, 106.8470, NOW() - INTERVAL '270 minutes', NOW() - INTERVAL '229 minutes', NOW() + INTERVAL '155 minutes',
     'Cerah', 'Lancar', NULL, 'IN_TRANSIT'),

    -- Indra Gunawan (HLM-002, IDLE)
    ('100024000537', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-002'),
     'Instant', 'Makanan Siap Saji', 1.60, 'Warung Sederhana', '081298765419', 'Jl. Matraman Raya No. 30', 'Matraman', 'Jakarta Timur',
     -6.2030, 106.8450, NOW() - INTERVAL '150 minutes', NOW() - INTERVAL '127 minutes', NOW() + INTERVAL '72 minutes',
     'Cerah', 'Sedang', NULL, 'IN_TRANSIT'),
    ('100024000538', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-002'),
     'Same Day', 'Kosmetik', 4.10, 'Sdri. Fitri', '081298765420', 'Jl. Raya Ciracas No. 15', 'Ciracas', 'Jakarta Timur',
     -6.3100, 106.8850, NOW() - INTERVAL '355 minutes', NOW() - INTERVAL '301 minutes', NOW() + INTERVAL '260 minutes',
     'Cerah', 'Lancar', NULL, 'IN_TRANSIT'),
    ('100024000539', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-002'),
     'Cargo', 'Sparepart Motor', 95.00, 'Bengkel Maju Motor', '081298765421', 'Jl. Raya Bogor KM 22', 'Kramat Jati', 'Jakarta Timur',
     -6.2900, 106.8720, NOW() - INTERVAL '300 minutes', NOW() - INTERVAL '255 minutes', NOW() + INTERVAL '145 minutes',
     'Berawan', 'Sedang', NULL, 'IN_TRANSIT'),

    -- Eko Prasetyo (HLM-003, IDLE)
    ('100024000541', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-003'),
     'Instant', 'Kue Ulang Tahun', 2.80, 'Ibu Lestari', '081298765423', 'Jl. Manggarai Selatan No. 3', 'Tebet', 'Jakarta Timur',
     -6.2180, 106.8460, NOW() - INTERVAL '160 minutes', NOW() - INTERVAL '136 minutes', NOW() + INTERVAL '41 minutes',
     'Hujan Ringan', 'Sedang', NULL, 'IN_TRANSIT'),

    -- Andi Wijaya (HLM-011, IDLE)
    ('100024000542', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-011'),
     'PHARMA', 'Obat Rutin', 1.20, 'Bpk. Sulistyo', '081298765425', 'Jl. Cawang Baru No. 7', 'Cawang', 'Jakarta Timur',
     -6.2410, 106.8720, NOW() - INTERVAL '345 minutes', NOW() - INTERVAL '293 minutes', NOW() + INTERVAL '300 minutes',
     'Cerah', 'Lancar', 21.0, 'IN_TRANSIT'),
    ('100024000543', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-011'),
     'Same Day', 'Hadiah & Aksesoris', 1.00, 'Sdri. Nadia', '081298765426', 'Jl. Bekasi Timur Raya No. 45', 'Pulogadung', 'Jakarta Timur',
     -6.1950, 106.9120, NOW() - INTERVAL '190 minutes', NOW() - INTERVAL '161 minutes', NOW() + INTERVAL '64 minutes',
     'Berawan', 'Sedang', NULL, 'IN_TRANSIT'),

    -- Bayu Nugroho (HLM-007, IDLE)
    ('100024000545', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), (SELECT id FROM couriers WHERE courier_code = 'HLM-007'),
     'Instant', 'Makanan Siap Saji', 1.60, 'Ibu Wulandari', '081298765427', 'Jl. Pendidikan Raya No. 20', 'Kramat Jati', 'Jakarta Timur',
     -6.2650, 106.8750, NOW() - INTERVAL '250 minutes', NOW() - INTERVAL '212 minutes', NOW() + INTERVAL '10 minutes',
     'Hujan Lebat', 'Macet Parah', NULL, 'IN_TRANSIT');

-- ============================================================================
-- 6. SEED: incident_reports
-- ============================================================================
INSERT INTO incident_reports (
    incident_code, order_id, courier_id, replacement_courier_id, handled_by_user_id,
    incident_category, title, description, location_address, latitude, longitude,
    weather_condition, traffic_condition, temperature_c,
    evidence_image_url, evidence_public_id,
    status, reported_at, resolved_at
)
VALUES
    -- INC-HLM-082: Mogok - REPORTED (belum ada pengganti)
    (
        'INC-HLM-082', (SELECT id FROM orders WHERE order_number = '100024000543'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-011'), NULL, (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Mogok Kendaraan', 'Kopling Rusak / Mogok', 'Motor mengalami kopling los di jalan panjang, paket terlantar di jalur',
        'Jl. Bekasi Timur Raya KM 3', -6.190000, 106.921000,
        'Cerah', 'Macet Total', NULL,
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
        'foto_bukti/inc-hlm-082-kopling-rusak',
        'REPORTED', NOW() - INTERVAL '4 minutes', NULL
    ),
    -- INC-HLM-083: Anomali Suhu - ESCALATED (lapor kemarin, tak pernah ditangani)
    (
        'INC-HLM-083', (SELECT id FROM orders WHERE order_number = '100024000009'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-008'), NULL, (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Anomali Suhu', 'Pendingin Tidak Stabil', 'Suhu box pendingin motor melonjak melewati ambang aman 5.0°C (terbaca 6.2°C)',
        'Jl. Condet Raya No. 18', -6.274800, 106.887000,
        'Berawan', 'Padat', 6.2,
        NULL, NULL,
        'ESCALATED', NOW() - INTERVAL '1 day 5 hours 35 minutes', NULL
    ),
    -- INC-HLM-085: Banjir - ESCALATED (sebelum dialihkan, masih di daftar insiden)
    (
        'INC-HLM-085', (SELECT id FROM orders WHERE order_number = '100024000540'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-009'), NULL, (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Banjir', 'Jalur Tergenang Air', 'Underpass Pramuka tergenang, koridor menuju tujuan tidak dapat dilalui',
        'Jl. Underpass Pramuka, Matraman', -6.204000, 106.854000,
        'Hujan Deras', 'Macet', NULL,
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'foto_bukti/inc-hlm-085-banjir-pramuka',
        'ESCALATED', NOW() - INTERVAL '41 minutes', NULL
    ),
    -- INC-HLM-086: Cuaca / Hujan - ESCALATED (lewat 10 menit)
    (
        'INC-HLM-086', (SELECT id FROM orders WHERE order_number = '100024000537'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), NULL, (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Cuaca / Hujan', 'Cuaca / Hujan', 'Hujan deras mengguyur Kramat Jati tanpa henti, genangan di bahu jalan membuat kendaraan pengantar berhenti di tengah rute',
        'Jl. Taman Mini Raya, Kramat Jati', -6.280000, 106.888000,
        'Hujan Deras', 'Macet', NULL,
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'foto_bukti/inc-hlm-086-hujan-deras',
        'ESCALATED', NOW() - INTERVAL '18 minutes', NULL
    );

-- ============================================================================
-- 6b. SEED: incident_evidences
-- ============================================================================
INSERT INTO incident_evidences (incident_id, cloudinary_public_id, secure_url, caption, uploaded_at)
VALUES
    (
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-082'),
        'foto_bukti/inc-hlm-082-kopling-rusak',
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
        'Foto kabel kopling truk putus di Jl. Panjang', NOW() - INTERVAL '4 minutes'
    ),
    (
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-085'),
        'foto_bukti/inc-hlm-085-banjir-pramuka',
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'Genangan banjir setinggi 40cm di jalan alternatif', NOW() - INTERVAL '40 minutes'
    ),
    (
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-086'),
        'foto_bukti/inc-hlm-086-hujan-deras',
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'Hujan deras mengguyur Kramat Jati', NOW() - INTERVAL '18 minutes'
    );

-- ============================================================================
-- 7. SEED: audit_logs (5 baris riwayat pengalihan)
-- ============================================================================
INSERT INTO audit_logs (
    log_code, order_id, incident_id, original_courier_id, replacement_courier_id, executor_user_id,
    incident_category, incident_detail, resolution_time_seconds, is_sla_saved,
    audit_hash, created_at
)
VALUES
    -- AUD-HLM-2026-0101
    (
        'AUD-HLM-2026-0101', (SELECT id FROM orders WHERE order_number = '100024000533'),
        NULL,
        (SELECT id FROM couriers WHERE courier_code = 'HLM-004'), (SELECT id FROM couriers WHERE courier_code = 'HLM-008'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Anomali Suhu', 'Anomali Suhu 6.4°C', 12.50, TRUE,
        encode(digest('AUD-HLM-2026-0101' || '100024000533' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'),
        NOW() - INTERVAL '1 day 4 hours 15 minutes'
    ),
    -- AUD-HLM-2026-0102
    (
        'AUD-HLM-2026-0102', (SELECT id FROM orders WHERE order_number = '100024000536'),
        NULL,
        (SELECT id FROM couriers WHERE courier_code = 'HLM-003'), (SELECT id FROM couriers WHERE courier_code = 'HLM-005'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Cuaca / Hujan', 'Cuaca: Hujan Lebat & Macet', 15.00, TRUE,
        encode(digest('AUD-HLM-2026-0102' || '100024000536' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'),
        NOW() - INTERVAL '1 day 2 hours 50 minutes'
    ),
    -- AUD-HLM-2026-0103
    (
        'AUD-HLM-2026-0103', (SELECT id FROM orders WHERE order_number = '100024000534'),
        NULL,
        (SELECT id FROM couriers WHERE courier_code = 'HLM-005'), (SELECT id FROM couriers WHERE courier_code = 'HLM-010'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Mogok Kendaraan', 'Kopling Rusak / Mogok', 11.50, TRUE,
        encode(digest('AUD-HLM-2026-0103' || '100024000534' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'),
        NOW() - INTERVAL '1 day 0 hours 25 minutes'
    ),
    -- AUD-HLM-2026-0104
    (
        'AUD-HLM-2026-0104', (SELECT id FROM orders WHERE order_number = '100024000541'),
        NULL,
        (SELECT id FROM couriers WHERE courier_code = 'HLM-011'), (SELECT id FROM couriers WHERE courier_code = 'HLM-003'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Mogok Kendaraan', 'Kopling Rusak / Mogok', 19.00, TRUE,
        encode(digest('AUD-HLM-2026-0104' || '100024000541' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'),
        NOW() - INTERVAL '1 day 1 hour 50 minutes'
    ),
    -- AUD-HLM-2026-0105: hari operasional (is_sla_saved = false)
    (
        'AUD-HLM-2026-0105', (SELECT id FROM orders WHERE order_number = '100024000543'),
        NULL,
        (SELECT id FROM couriers WHERE courier_code = 'HLM-004'), (SELECT id FROM couriers WHERE courier_code = 'HLM-011'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Ban Bocor', 'Ban Belakang Pecah', 22.00, FALSE,
        encode(digest('AUD-HLM-2026-0105' || '100024000543' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'),
        NOW() - INTERVAL '50 minutes'
    );

COMMIT;

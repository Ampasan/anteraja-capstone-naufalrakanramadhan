CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

TRUNCATE TABLE audit_logs, reassignment_confirmations, incident_evidences, incident_reports, order_assignments, order_tracking_events, delay_predictions, courier_telemetries, orders, couriers, users, hubs CASCADE;

-- ============================================================================
-- 1. SEED: hubs
-- ============================================================================
INSERT INTO hubs (hub_code, hub_name, city, address, latitude, longitude, service_radius_km, max_capacity_parcels, current_parcels_count)
VALUES
    ('HUB-JAKTIM-HALIM', 'ANTERAJA HUB HALIM', 'Jakarta Timur', 'Graha Intirub Gate 46, RT.7/RW.11, Kebon Pala, Kec. Makasar, Kota Jakarta Timur, DKI Jakarta 13650', -6.2651893, 106.8767953, 5.0, 2850, 2410),
    ('HUB-BDG-BATUNUNGGAL', 'Hub Batununggal – Bandung', 'Bandung', 'Jl. Batununggal Indah Raya No. 45, Bandung', -6.9538120, 107.6274190, 4.0, 2500, 1820),
    ('HUB-BKS-HARAPANINDAH', 'Hub Harapan Indah – Bekasi', 'Bekasi', 'Ruko Sentra Niaga Blok SN, Kota Harapan Indah, Bekasi', -6.1802150, 106.9842110, 7.0, 2200, 1450),
    ('HUB-JAKBAR-KEBONJERUK', 'Hub Kebon Jeruk – Jakarta Barat', 'Jakarta Barat', 'Jl. Kebon Jeruk Raya No. 12, Jakarta Barat', -6.1895120, 106.7699410, 5.0, 3000, 2600),
    ('HUB-JAKUT-SUNTER', 'Hub Sunter – Jakarta Utara', 'Jakarta Utara', 'Jl. Danau Sunter Utara Blok F, Jakarta Utara', -6.1384720, 106.8654190, 6.0, 2400, 1900);

-- ============================================================================
-- 2. SEED: users
-- ============================================================================
INSERT INTO users (hub_id, name, email, password_hash, role, status)
VALUES
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Siti Rahmawati', 'siti.admin@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE'),
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Reza Bramantyo', 'reza.bramantyo@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE'),
    ((SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'), 'Dewi Lestari', 'dewi.cc@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE');

-- ============================================================================
-- 3. SEED: couriers
-- ============================================================================
INSERT INTO couriers (
    courier_code, hub_id, name, phone_number, license_plate, vehicle_type, status,
    current_parcel_count, max_parcel_count, current_load_kg, max_capacity_kg, current_address,
    is_bpom_certified, has_thermal_box
)
VALUES
    ('STR-JKT-001', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Budi Santoso', '081234567801', 'B 3481 HLM', 'Motorcycle', 'ONLINE',
     12, 20, 24.50, 50.00, 'Jl. Cililitan Besar No. 5, Kramat Jati, Jakarta Timur', TRUE, TRUE),
    ('HLM-VAN-02', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Teguh Wibowo', '081234567802', 'B 9281 HLM', 'Truk', 'IDLE',
     5, 20, 186.80, 2000.00, 'Jl. Pondok Kopi Raya No. 12, Pondok Kopi, Jakarta Timur', FALSE, FALSE),
    ('HLM-004', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Fajar Ramadhan', '081234567803', 'B 9282 HLM', 'Van', 'ONLINE',
     8, 20, 400.00, 1200.00, 'Jl. Halim Perdanakusuma No. 8, Makasar, Jakarta Timur', TRUE, TRUE),
    ('HLM-005', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Ahmad Fauzi', '081234567804', 'B 9112 HLM', 'Truk Box', 'ONLINE',
     4, 20, 500.00, 2000.00, 'Jl. Condet Raya No. 30, Kramat Jati, Jakarta Timur', FALSE, FALSE),
    ('HLM-008', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Rizky Pratama', '081234567805', 'B 6214 HLM', 'Motorcycle thermal box', 'ONLINE',
     9, 20, 18.20, 40.00, 'Jl. Condet Raya No. 18, Kramat Jati, Jakarta Timur', TRUE, TRUE),
    ('HLM-009', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Rama Pratama', '081234567806', 'B 4118 HLM', 'Motorcycle', 'IDLE',
     9, 20, 15.00, 40.00, 'Jl. Jatinegara Kaum No. 88, Jatinegara, Jakarta Timur', FALSE, FALSE),
    ('HLM-002', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Indra Gunawan', '081234567807', 'B 5512 HLM', 'Blind Van', 'ONLINE',
     11, 20, 35.00, 800.00, 'Jl. Buaran Raya No. 14, Duren Sawit, Jakarta Timur', FALSE, FALSE),
    ('HLM-003', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Eko Prasetyo', '081234567808', 'B 6719 HLM', 'Pick Up Box', 'ONLINE',
     10, 20, 45.00, 1000.00, 'Jl. Kampung Melayu Besar No. 9, Tebet, Jakarta Selatan', FALSE, FALSE),
    ('STR-JKT-008', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
     'Andi Wijaya', '081234567809', 'B 1234 STR', 'Motorcycle', 'ONLINE',
     3, 20, 3.00, 15.00, 'Jl. Ir. H. Djuanda, Cawang, Jakarta Timur', TRUE, FALSE);

-- ============================================================================
-- 4. SEED: courier_telemetries
-- ============================================================================
INSERT INTO courier_telemetries (courier_id, latitude, longitude, speed_kmh, temperature_c, battery_level, recorded_at)
VALUES
    ((SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), -6.2678, 106.8812, 22.50, NULL, 92, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-VAN-02'), -6.2172, 106.9248, 0.00, NULL, 48, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-004'), -6.2622, 106.8802, 31.00, NULL, 85, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-008'), -6.2712, 106.8838, 18.00, 6.2, 74, NOW()),
    ((SELECT id FROM couriers WHERE courier_code = 'HLM-009'), -6.2598, 106.8730, 0.00, NULL, 65, NOW());

-- ============================================================================
-- 5. SEED: orders
-- ============================================================================
INSERT INTO orders (
    order_number, hub_origin_id, current_courier_id, service_type, category,
    weight_kg, recipient_name, recipient_phone, destination_address, destination_district, destination_city,
    drop_latitude, drop_longitude, order_time, pickup_time, delivery_time_minutes, sla_deadline,
    weather_condition, traffic_condition, temperature_c, delivery_status,
    manifest_number, estimated_arrival_time, remaining_distance_km, sla_risk_score
)
VALUES
    (
        '100024000012', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-VAN-02'), 'Cargo', 'Peralatan Pabrik',
        186.80, 'PT Sentosa Abadi', '081298765401', 'Jl. Pondok Kopi Raya No. 12', 'Pondok Kopi', 'Jakarta Timur',
        -6.2172, 106.9248, '2026-09-24 08:30:00+07', '2026-09-24 09:15:00+07', 360, NOW() + INTERVAL '25 minutes',
        'Cerah', 'Macet Total', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000009', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-008'), 'Frozen', 'Frozen Food & Daging',
        4.50, 'Resto Daging Sedap', '081298765402', 'Jl. Condet Raya No. 18', 'Kramat Jati', 'Jakarta Timur',
        -6.2748, 106.8870, '2026-09-24 10:00:00+07', '2026-09-24 10:30:00+07', 180, NOW() + INTERVAL '12 minutes',
        'Berawan', 'Padat', 6.2, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000000', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), 'Same Day', 'Snack & Makanan',
        1.40, 'Ibu Ratna', '081298765403', 'Jl. Gatot Subroto Kav. 22, Kramat Jati', 'Kramat Jati', 'Jakarta Timur',
        -6.2610, 106.8695, '2026-09-24 09:00:00+07', '2026-09-24 09:40:00+07', 240, NOW() + INTERVAL '18 minutes',
        'Cerah', 'Sedang', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000008', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), 'Instant', 'Dokumen Mendesak',
        0.80, 'Bpk. Hendra', '081298765404', 'Jl. Ir. H. Djuanda No. 120, Cawang', 'Cawang', 'Jakarta Timur',
        -6.2432, 106.8640, '2026-09-24 11:00:00+07', '2026-09-24 11:15:00+07', 120, NOW() + INTERVAL '12 minutes',
        'Hujan lebat', 'macet', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000108', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-008'), 'Frozen', 'Ikan Salmon Segar',
        3.20, 'Ibu Maya', '081298765405', 'Jl. Cipinang Muara No. 42', 'Cipinang Muara', 'Jakarta Timur',
        -6.2318, 106.9015, '2026-09-24 09:30:00+07', '2026-09-24 10:00:00+07', 240, NOW() + INTERVAL '14 minutes',
        'Cerah', 'Lancar', 3.8, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000254', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-009'), 'Same Day', 'Pakaian & Mode',
        1.90, 'Sdri. Cindy', '081298765406', 'Jl. Buaran Raya No. 88', 'Duren Sawit', 'Jakarta Timur',
        -6.2215, 106.9088, '2026-09-24 08:00:00+07', '2026-09-24 08:45:00+07', 360, NOW() + INTERVAL '18 minutes',
        'Hujan Ringan', 'Sedang', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000411', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), 'PHARMA', 'Vaksin & Obat Resep',
        2.10, 'RS Islam Jakarta Timur', '081298765407', 'Jl. Jatinegara Barat No. 126', 'Jatinegara', 'Jakarta Timur',
        -6.2488, 106.9012, '2026-09-24 08:30:00+07', '2026-09-24 09:10:00+07', 360, NOW() + INTERVAL '24 minutes',
        'Berawan', 'Cawang Padat', 18.5, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000529', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-004'), 'Cargo', 'Elektronik Rumah Tangga',
        75.00, 'Toko Jaya Makmur', '081298765408', 'Jl. Pondok Kopi Raya No. 12', 'Pondok Kopi', 'Jakarta Timur',
        -6.2172, 106.9248, '2026-09-24 07:00:00+07', '2026-09-24 07:50:00+07', 480, NOW() + INTERVAL '45 minutes',
        'Normal Cerah', 'Lancar', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000678', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), 'Dokumen', 'Kontrak Legal Notaris',
        0.50, 'PT Cipta Integra', '081298765409', 'Jl. Jend. Basuki Rachmat No. 71, Jatinegara', 'Jatinegara', 'Jakarta Timur',
        -6.2388, 106.8905, '2026-09-24 07:30:00+07', '2026-09-24 08:15:00+07', 480, NOW() + INTERVAL '58 minutes',
        'Cerah', 'Jalanan Lancar', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000781', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-004'), 'Next Day', 'Sepatu Olahraga',
        1.20, 'Bpk. Fajar', '081298765410', 'Apartemen Green Pramuka, Kramat Jati', 'Kramat Jati', 'Jakarta Timur',
        -6.2522, 106.8712, '2026-09-23 16:00:00+07', '2026-09-24 08:00:00+07', 1440, NOW() + INTERVAL '75 minutes',
        'Normal Lancar', 'Lancar', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000912', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-001'), 'Regular', 'Buku & Alat Tulis',
        2.00, 'Ibu Desi', '081298765411', 'Jl. Jatinegara Timur Blok VI No. 8', 'Jatinegara Timur', 'Jakarta Timur',
        -6.2140, 106.8980, '2026-09-22 14:00:00+07', '2026-09-23 09:00:00+07', 2880, NOW() + INTERVAL '100 minutes',
        'Normal Lancar', 'Lancar', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000104', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), 'Next Day', 'Pakaian & Tekstil',
        6.00, 'Bpk. Ridwan', '081298765412', 'Jl. Buaran Raya No. 45', 'Duren Sawit', 'Jakarta Timur',
        -6.2215, 106.9088, '2026-09-23 10:00:00+07', '2026-09-23 10:30:00+07', 1440, NOW() + INTERVAL '15 minutes',
        'Hujan Lebat', 'Macet Total', NULL, 'IN_TRANSIT',
        NULL, NULL, NULL, NULL
    ),
    (
        '100024000888', (SELECT id FROM hubs WHERE hub_code = 'HUB-JAKTIM-HALIM'),
        (SELECT id FROM couriers WHERE courier_code = 'STR-JKT-008'), 'Instant', 'Dokumen Cepat',
        0.50, 'Bpk. Hendra', '081298765404', 'Jl. Ir. H. Djuanda No. 120, Cawang, Kramat Jati, Kota Jakarta Timur, DKI Jakarta 13630', 'Cawang', 'Jakarta Timur',
        -6.2432, 106.8640, '2026-09-24 13:30:00+07', '2026-09-24 13:45:00+07', 120, '2026-09-24 15:30:00+07',
        'Hujan Lebat', 'Macet Parah', NULL, 'IN_TRANSIT',
        'MNF-HLM-00021', '2026-09-24 14:12:00+07', 2.8, 8.7
    );

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
    -- Insiden 1: Masih REPORTED (belum dikonfirmasi 1-klik)
    -- CATATAN: Insiden Anomali Suhu
    (
        'INC-HLM-083', (SELECT id FROM orders WHERE order_number = '100024000009'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-008'), NULL, (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Anomali Suhu', 'Pendingin Tidak Stabil', 'Suhu box pendingin motor melonjak melewati ambang aman 5.0°C (terbaca 6.2°C)',
        'Jl. Gatot Subroto', -6.230100, 106.832400,
        'Berawan', 'Padat', 6.2,
        NULL, NULL,
        'REPORTED', '2026-09-24 11:20:00+07', NULL
    ),
    -- Insiden 2: Masih REASSIGNING (kurir pengganti ditunjuk, belum selesai)
    (
        'INC-HLM-082', (SELECT id FROM orders WHERE order_number = '100024000012'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-VAN-02'), (SELECT id FROM couriers WHERE courier_code = 'HLM-004'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Mogok Kendaraan', 'Kopling Rusak / Mogok', 'Kendaraan truk mengalami kopling los di jalan panjang',
        'Jl. Panjang No. 14', -6.185210, 106.771230,
        'Cerah', 'Macet Total', NULL,
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
        'foto_bukti/inc-hlm-082-kopling-rusak',
        'REASSIGNING', '2026-09-24 10:55:00+07', NULL
    ),
    -- Insiden 3: SUDAH RESOLVED (1-klik dikonfirmasi) → ADA di audit_logs
    (
        'INC-HLM-077', (SELECT id FROM orders WHERE order_number = '100024000104'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), (SELECT id FROM couriers WHERE courier_code = 'HLM-003'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Cuaca / Hujan', 'Cuaca: Hujan Lebat & Macet', 'Hujan deras disertai genangan air memicu macet parah',
        'Jl. Tebet Barat Dalam', -6.229100, 106.851200,
        'Hujan Lebat', 'Macet Total', NULL,
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'foto_bukti/inc-hlm-077-cuaca-hujan',
        'RESOLVED', '2026-09-24 14:00:00+07', '2026-09-24 14:15:00+07'
    );

-- ============================================================================
-- 6b. SEED: incident_evidences
-- ============================================================================
INSERT INTO incident_evidences (incident_id, cloudinary_public_id, secure_url, folder, file_format, file_size_bytes, caption, uploaded_at)
VALUES
    (
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-082'),
        'foto_bukti/inc-hlm-082-kopling-rusak',
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
        'foto_bukti', 'jpg', 245120, 'Foto kabel kopling truk putus di Jl. Panjang', '2026-09-24 10:55:30+07'
    ),
    (
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-077'),
        'foto_bukti/inc-hlm-077-cuaca-hujan',
        'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
        'foto_bukti', 'jpg', 312050, 'Genangan banjir setinggi 40cm di jalan alternatif', '2026-09-24 14:01:10+07'
    );

-- ============================================================================
-- 7. SEED: order_assignments
-- ============================================================================
INSERT INTO order_assignments (
    order_id, courier_id, incident_id, assigned_by_user_id, assignment_status, reason, assigned_at, completed_at
)
VALUES
    -- Insiden INC-HLM-077 (SUDAH RESOLVED): assignment lama → REASSIGNED
    (
        (SELECT id FROM orders WHERE order_number = '100024000104'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-077'),
        (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'), 'REASSIGNED', 'Terjebak hujan lebat & macet',
        '2026-09-24 10:30:00+07', '2026-09-24 14:15:00+07'
    ),
    -- Insiden INC-HLM-077 (SUDAH RESOLVED): assignment baru → ACTIVE (kurir pengganti)
    (
        (SELECT id FROM orders WHERE order_number = '100024000104'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-003'), (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-077'),
        (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'), 'ACTIVE', 'Pengalihan 1-Klik diterima kurir pengganti Eko Prasetyo',
        '2026-09-24 14:15:00+07', NULL
    );

-- Setelah reassignment selesai, order menunjuk kurir pengganti yang aktif.
UPDATE orders
SET current_courier_id = (SELECT id FROM couriers WHERE courier_code = 'HLM-003')
WHERE order_number = '100024000104';

-- ============================================================================
-- 8. SEED: audit_logs (HANYA untuk insiden yang SUDAH dikonfirmasi 1-klik)
-- ============================================================================
INSERT INTO audit_logs (
    log_code, order_id, incident_id, original_courier_id, replacement_courier_id, executor_user_id,
    incident_category, incident_detail, action_type, resolution_time_seconds, is_sla_saved,
    audit_hash, notes, created_at
)
VALUES
    -- Audit untuk INC-HLM-077 (sudah RESOLVED)
    (
        'AUD-HLM-2026-0104', (SELECT id FROM orders WHERE order_number = '100024000104'),
        (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-077'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), (SELECT id FROM couriers WHERE courier_code = 'HLM-003'), (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'),
        'Cuaca / Hujan', 'Cuaca: Hujan Lebat & Macet', 'ONE_CLICK_REASSIGNMENT', 18.00, TRUE,
        encode(digest('AUD-HLM-2026-0104' || '100024000104' || 'ONE_CLICK_REASSIGNMENT', 'sha256'), 'hex'), 'Pengalihan sukses, SLA terselamatkan',
        '2026-09-24 14:15:00+07'
    );

-- ============================================================================
-- 8b. SEED: reassignment_confirmations
-- ============================================================================
INSERT INTO reassignment_confirmations (
    confirmation_code, incident_id, order_id, original_courier_id, replacement_courier_id,
    confirmed_by_user_id, confirmation_method, confirmation_time, estimated_resolution_seconds,
    actual_resolution_seconds, is_sla_saved, status, notes
)
VALUES
    -- Konfirmasi 1-klik untuk INC-HLM-077 (sudah RESOLVED)
    (
        'RSC-HLM-2026-001', (SELECT id FROM incident_reports WHERE incident_code = 'INC-HLM-077'),
        (SELECT id FROM orders WHERE order_number = '100024000104'),
        (SELECT id FROM couriers WHERE courier_code = 'HLM-002'), (SELECT id FROM couriers WHERE courier_code = 'HLM-003'),
        (SELECT id FROM users WHERE email = 'siti.admin@anteraja.id'), 'ONE_CLICK', '2026-09-24 14:15:00+07',
        300, 18, TRUE, 'CONFIRMED', 'Pengalihan 1-Klik berhasil, kurir pengganti Eko Prasetyo aktif'
    );

-- ============================================================================
-- 9. SEED: order_tracking_events
-- ============================================================================
INSERT INTO order_tracking_events (
    order_id, event_type, event_time, location_description, manifest_number, sortation_gate,
    speed_kmh, traffic_condition, weather_condition, remaining_distance_km, estimated_arrival_time, remaining_minutes, notes
)
VALUES
    -- Tracking event untuk order yang sudah di-reassign (INC-HLM-077)
    (
        (SELECT id FROM orders WHERE order_number = '100024000104'),
        'CHECKPOINT', '2026-09-24 14:20:00+07', 'Kurir pengganti Eko Prasetyo mengambil alih paket', NULL, NULL,
        NULL, NULL, NULL, NULL, NULL, NULL, 'Reassignment 1-Klik selesai, kurir baru aktif'
    );

-- ============================================================================
-- 10. SEED: delay_predictions
-- ============================================================================
-- CATATAN: delay predictions hanya dibuat SETELAH konfirmasi 1-klik.
INSERT INTO delay_predictions (
    order_id, weather_condition, traffic_condition, sla_risk_level, sla_risk_score, predicted_delay_minutes, analysis_summary
)
VALUES
    (
        (SELECT id FROM orders WHERE order_number = '100024000104'),
        'Hujan Lebat', 'Macet Total', 'Tinggi', 7.5, 8,
        'Reassignment 1-Klik mengurangi risiko keterlambatan dari 15 menit menjadi 8 menit'
    );

COMMIT;

TRUNCATE TABLE audit_logs, incident_reports, order_assignments, courier_telemetries, orders, couriers, users, hubs CASCADE;

-- ============================================================================
-- 1. SEED: hubs
-- ============================================================================
INSERT INTO hubs (id, hub_code, hub_name, city, latitude, longitude, max_capacity_parcels, current_parcels_count)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'HUB-JAKSEL-TEBET', 'Hub Tebet – Jakarta Selatan', 'Jakarta Selatan', -6.225588, 106.855324, 2850, 2410),
    ('11111111-1111-1111-1111-111111111102', 'HUB-BDG-BATUNUNGGAL', 'Hub Batununggal – Bandung', 'Bandung', -6.953812, 107.627419, 2500, 1820),
    ('11111111-1111-1111-1111-111111111103', 'HUB-BKS-HARAPANINDAH', 'Hub Harapan Indah – Bekasi', 'Bekasi', -6.180215, 106.984211, 2200, 1450),
    ('11111111-1111-1111-1111-111111111104', 'HUB-JAKBAR-KEBONJERUK', 'Hub Kebon Jeruk – Jakarta Barat', 'Jakarta Barat', -6.189512, 106.769941, 3000, 2600),
    ('11111111-1111-1111-1111-111111111105', 'HUB-JAKUT-SUNTER', 'Hub Sunter – Jakarta Utara', 'Jakarta Utara', -6.138472, 106.865419, 2400, 1900);

-- ============================================================================
-- 2. SEED: users
-- ============================================================================
INSERT INTO users (id, hub_id, name, email, password_hash, role, status, is_active)
VALUES
    -- Admin Siti (Gambar 3 Login Screen)
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Siti Rahmawati', 'siti.admin@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE', TRUE),
    -- Reza Bramantyo (Gambar 1, 2, 4, 5 Header Profile RB)
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Reza Bramantyo', 'reza.bramantyo@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE', TRUE),
    -- Admin Staff Dewi
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Dewi Lestari', 'dewi.cc@anteraja.id', '$2y$12$K8yR2uU547G4eN3eT5qJDe6XlJ1lKz9eK9xH5nK3oU1lK2mF6eP4u', 'ADMIN', 'ACTIVE', TRUE);

-- ============================================================================
-- 3. SEED: couriers
-- ============================================================================
INSERT INTO couriers (
    id, courier_code, hub_id, name, phone_number, license_plate, vehicle_type, status,
    current_parcel_count, max_parcel_count, current_load_kg, max_capacity_kg, current_address,
    is_bpom_certified, has_thermal_box
)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'STR-JKT-001', '11111111-1111-1111-1111-111111111101', 
     'Budi Santoso', '081234567801', 'B 3481 TBT', 'Motor', 'ONLINE', 
     12, 20, 24.50, 50.00, 'Jl. Tebet Raya', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333302', 'SATRIA-VAN-02', '11111111-1111-1111-1111-111111111101', 
     'Teguh Wibowo', '081234567802', 'CDD B 9281 KXT', 'Truk', 'IDLE', 
     5, 20, 186.80, 2000.00, 'Jl. Panjang No. 14', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333303', 'SATRIA-004', '11111111-1111-1111-1111-111111111101', 
     'Fajar Ramadhan', '081234567803', 'B 9281 KXT', 'Van', 'ONLINE', 
     8, 20, 400.00, 1200.00, 'Jl. Kebon Jeruk Raya', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333304', 'SATRIA-005', '11111111-1111-1111-1111-111111111101', 
     'Ahmad Fauzi', '081234567804', 'B 9112 PXT', 'Truk Box', 'ONLINE', 
     4, 20, 500.00, 2000.00, 'Jl. Panjang No. 30', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333305', 'SATRIA-008', '11111111-1111-1111-1111-111111111101', 
     'Rizky Pratama', '081234567805', 'B 6214 KBD', 'Motor chiller box', 'ONLINE', 
     9, 20, 18.20, 40.00, 'Jl. Gatot Subroto', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333306', 'SATRIA-009', '11111111-1111-1111-1111-111111111101', 
     'Rama Pratama', '081234567806', 'B 4118 TBZ', 'Motor', 'IDLE', 
     9, 20, 15.00, 40.00, 'Jl. Gatot Subroto No. 88', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333307', 'SATRIA-002', '11111111-1111-1111-1111-111111111101', 
     'Indra Gunawan', '081234567807', 'B 5512 TBC', 'Blind Van', 'ONLINE', 
     11, 20, 35.00, 800.00, 'Jl. Tebet Barat Dalam', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333308', 'SATRIA-003', '11111111-1111-1111-1111-111111111101', 
     'Eko Prasetyo', '081234567808', 'B 6719 TBE', 'Pick Up Box', 'ONLINE', 
     10, 20, 45.00, 1000.00, 'Jl. Tebet Timur', FALSE, FALSE);

-- ============================================================================
-- 4. SEED: courier_telemetries
-- ============================================================================
INSERT INTO courier_telemetries (id, courier_id, latitude, longitude, speed_kmh, temperature_c, battery_level, recorded_at)
VALUES
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', -6.225588, 106.855324, 22.50, NULL, 92, NOW()),
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', -6.185210, 106.771230, 0.00, NULL, 48, NOW()),
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333303', -6.188400, 106.776100, 31.00, NULL, 85, NOW()),
    ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333305', -6.230100, 106.832400, 18.00, 6.2, 74, NOW()),
    ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333306', -6.231200, 106.834500, 0.00, NULL, 65, NOW());

-- ============================================================================
-- 5. SEED: orders
-- ============================================================================
INSERT INTO orders (
    id, order_number, hub_origin_id, current_courier_id, service_type, category,
    weight_kg, recipient_name, recipient_phone, destination_address, destination_district, destination_city,
    drop_latitude, drop_longitude, order_time, pickup_time, delivery_time_minutes, sla_deadline,
    sla_remaining_minutes, weather_condition, traffic_condition, temperature_c, delivery_status, sla_status
)
VALUES
    (
        '55555555-5555-5555-5555-555555555501', '100024000012', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333302', 'Cargo', 'Peralatan Pabrik',
        186.80, 'PT Sentosa Abadi', '081298765401', 'Jl. Kebon Jeruk Raya', 'Kebon Jeruk', 'Jakarta Barat',
        -6.191240, 106.772310, '2026-09-24 08:30:00+07', '2026-09-24 09:15:00+07', 360, '2026-09-24 15:15:00+07',
        25, 'Cerah', 'Macet Total', NULL, 'Incident_Reported', 'WASPADA'
    ),
    (
        '55555555-5555-5555-5555-555555555502', '100024000009', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333305', 'Frozen', 'Frozen Food & Daging',
        4.50, 'Resto Daging Sedap', '081298765402', 'Tebet Barat V', 'Tebet', 'Jakarta Selatan',
        -6.234120, 106.848900, '2026-09-24 10:00:00+07', '2026-09-24 10:30:00+07', 180, '2026-09-24 13:30:00+07',
        12, 'Berawan', 'Padat', 6.2, 'Incident_Reported', 'KRITIS'
    ),
    (
        '55555555-5555-5555-5555-555555555503', '100024000000', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333301', 'Same Day', 'Snack & Makanan',
        1.40, 'Ibu Ratna', '081298765403', 'Jl. Gatot Subroto Kav. 22', 'Tebet', 'Jakarta Selatan',
        -6.228145, 106.835210, '2026-09-24 09:00:00+07', '2026-09-24 09:40:00+07', 240, '2026-09-24 13:40:00+07',
        18, 'Cerah', 'Sedang', NULL, 'In_Transit', 'WASPADA'
    ),
    (
        '55555555-5555-5555-5555-555555555504', '100024000008', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333301', 'Instant', 'Dokumen Mendesak',
        0.80, 'Bpk. Hendra', '081298765404', 'Jl. Ir. H. Djuanda No. 120', 'Cilandak', 'Jakarta Selatan',
        -6.191771, 106.819609, '2026-09-24 11:00:00+07', '2026-09-24 11:15:00+07', 120, '2026-09-24 13:15:00+07',
        12, 'Hujan lebat', 'macet', NULL, 'In_Transit', 'KRITIS'
    ),
    (
        '55555555-5555-5555-5555-555555555505', '100024000108', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333305', 'Frozen', 'Ikan Salmon Segar',
        3.20, 'Ibu Maya', '081298765405', 'Jl. Cipete Raya No. 42', 'Cilandak', 'Jakarta Selatan',
        -6.275140, 106.802100, '2026-09-24 09:30:00+07', '2026-09-24 10:00:00+07', 240, '2026-09-24 14:00:00+07',
        14, 'Cerah', 'Lancar', 3.8, 'In_Transit', 'KRITIS'
    ),
    (
        '55555555-5555-5555-5555-555555555506', '100024000254', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333306', 'Same Day', 'Pakaian & Mode',
        1.90, 'Sdri. Cindy', '081298765406', 'Jl. Prof. DR. Soepomo No. 88', 'Cilandak', 'Jakarta Selatan',
        -6.238910, 106.845120, '2026-09-24 08:00:00+07', '2026-09-24 08:45:00+07', 360, '2026-09-24 14:45:00+07',
        18, 'Hujan Ringan', 'Sedang', NULL, 'In_Transit', 'WASPADA'
    ),
    (
        '55555555-5555-5555-5555-555555555507', '100024000411', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333301', 'PHARMA', 'Vaksin & Obat Resep',
        2.10, 'Apotek Sehat Cilandak', '081298765407', 'RS Tebet Medical Center', 'Cilandak', 'Jakarta Selatan',
        -6.241200, 106.852300, '2026-09-24 08:30:00+07', '2026-09-24 09:10:00+07', 360, '2026-09-24 15:10:00+07',
        24, 'Berawan', 'Cawang Padat', 18.5, 'In_Transit', 'WASPADA'
    ),
    (
        '55555555-5555-5555-5555-555555555508', '100024000529', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333303', 'Cargo', 'Elektronik Rumah Tangga',
        75.00, 'Toko Jaya Makmur', '081298765408', 'Gudang Logistik Pancoran', 'Cilandak', 'Jakarta Selatan',
        -6.249100, 106.841200, '2026-09-24 07:00:00+07', '2026-09-24 07:50:00+07', 480, '2026-09-24 15:50:00+07',
        45, 'Normal Cerah', 'Lancar', NULL, 'In_Transit', 'AMAN'
    ),
    (
        '55555555-5555-5555-5555-555555555509', '100024000678', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333301', 'Dokumen', 'Kontrak Legal Notaris',
        0.50, 'PT Cipta Integra', '081298765409', 'Menara Bidakara Lt. 15', 'Cilandak', 'Jakarta Selatan',
        -6.241500, 106.839800, '2026-09-24 07:30:00+07', '2026-09-24 08:15:00+07', 480, '2026-09-24 16:15:00+07',
        58, 'Cerah', 'Jalanan Lancar', NULL, 'In_Transit', 'AMAN'
    ),
    (
        '55555555-5555-5555-5555-555555555510', '100024000781', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333303', 'Next Day', 'Sepatu Olahraga',
        1.20, 'Bpk. Fajar', '081298765410', 'Apartemen Signature Park', 'Cilandak', 'Jakarta Selatan',
        -6.242800, 106.862100, '2026-09-23 16:00:00+07', '2026-09-24 08:00:00+07', 1440, '2026-09-24 16:00:00+07',
        75, 'Normal Lancar', 'Lancar', NULL, 'In_Transit', 'AMAN'
    ),
    (
        '55555555-5555-5555-5555-555555555511', '100024000912', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333301', 'Regular', 'Buku & Alat Tulis',
        2.00, 'Ibu Desi', '081298765411', 'Ruko Tebet Timur Dalam VI', 'Tebet Timur', 'Jakarta Selatan',
        -6.231900, 106.858200, '2026-09-22 14:00:00+07', '2026-09-23 09:00:00+07', 2880, '2026-09-24 18:00:00+07',
        100, 'Normal Lancar', 'Lancar', NULL, 'In_Transit', 'AMAN'
    ),
    (
        '55555555-5555-5555-5555-555555555512', '100024000104', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333308', 'Next Day', 'Pakaian & Tekstil',
        6.00, 'Bpk. Ridwan', '081298765412', 'Jl. Tebet Raya No. 45', 'Tebet', 'Jakarta Selatan',
        -6.229100, 106.851200, '2026-09-23 10:00:00+07', '2026-09-23 10:30:00+07', 1440, '2026-09-24 14:30:00+07',
        15, 'Hujan Lebat', 'Macet Total', NULL, 'In_Transit', 'SAFE'
    );

-- ============================================================================
-- 6. SEED: incident_reports
-- ============================================================================
INSERT INTO incident_reports (
    id, incident_code, order_id, courier_id, replacement_courier_id, handled_by_user_id,
    incident_category, title, description, location_address, latitude, longitude,
    weather_condition, traffic_condition, temperature_c, status, reported_at, resolved_at
)
VALUES
    (
        '77777777-7777-7777-7777-777777777701', 'INC-TEB-082', '55555555-5555-5555-5555-555555555501',
        '33333333-3333-3333-3333-333333333302', '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201',
        'Mogok Kendaraan', 'Kopling Rusak / Mogok', 'Kendaraan truk mengalami kopling los di jalan panjang',
        'Jl. Panjang No. 14', -6.185210, 106.771230,
        'Cerah', 'Macet Total', NULL, 'REASSIGNING', '2026-09-24 10:55:00+07', NULL
    ),
    (
        '77777777-7777-7777-7777-777777777702', 'INC-TEB-083', '55555555-5555-5555-5555-555555555502',
        '33333333-3333-3333-3333-333333333305', NULL, '22222222-2222-2222-2222-222222222201',
        'Anomali Suhu', 'Pendingin Tidak Stabil', 'Suhu box pendingin motor melonjak melewati ambang aman 5.0°C',
        'Jl. Gatot Subroto', -6.230100, 106.832400,
        'Berawan', 'Padat', 6.2, 'REPORTED', '2026-09-24 11:20:00+07', NULL
    ),)
    (
        '77777777-7777-7777-7777-777777777703', 'INC-TEB-077', '55555555-5555-5555-5555-555555555512',
        '33333333-3333-3333-3333-333333333307', '33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222201',
        'Cuaca / Hujan', 'Cuaca: Hujan Lebat & Macet', 'Hujan deras disertai genangan air memicu macet parah',
        'Jl. Tebet Barat Dalam', -6.229100, 106.851200,
        'Hujan Lebat', 'Macet Total', NULL, 'RESOLVED', '2026-09-24 14:00:00+07', '2026-09-24 14:15:00+07'
    );

-- ============================================================================
-- 7. SEED: order_assignments
-- ============================================================================
INSERT INTO order_assignments (
    id, order_id, courier_id, incident_id, assigned_by_user_id, assignment_status, reason, assigned_at, completed_at
)
VALUES
    (
        '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555512',
        '33333333-3333-3333-3333-333333333307', '77777777-7777-7777-7777-777777777703',
        '22222222-2222-2222-2222-222222222201', 'REASSIGNED', 'Terjebak hujan lebat & macet',
        '2026-09-24 10:30:00+07', '2026-09-24 14:15:00+07'
    ),
    (
        '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555512',
        '33333333-3333-3333-3333-333333333308', '77777777-7777-7777-7777-777777777703',
        '22222222-2222-2222-2222-222222222201', 'ACTIVE', 'Pengalihan 1-Klik diterima kurir pengganti Eko Prasetyo',
        '2026-09-24 14:15:00+07', NULL
    );

-- ============================================================================
-- 8. SEED: audit_logs
-- ============================================================================
INSERT INTO audit_logs (
    id, log_code, order_id, original_courier_id, replacement_courier_id, executor_user_id,
    incident_category, incident_detail, action_type, resolution_time_seconds, is_sla_saved,
    audit_hash, notes, created_at
)
VALUES
    (
        '88888888-8888-8888-8888-888888888801', 'AUD-TEB-2026-0104', '55555555-5555-5555-5555-555555555512',
        '33333333-3333-3333-3333-333333333307', '33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222201',
        'Cuaca / Hujan', 'Cuaca: Hujan Lebat & Macet', 'ONE_CLICK_REASSIGNMENT', 18.00, TRUE,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Pengalihan sukses, SLA terselamatkan',
        '2026-09-24 14:15:00+07'
    ),
    (
        '88888888-8888-8888-8888-888888888802', 'AUD-TEB-2026-0107', '55555555-5555-5555-5555-555555555502',
        '33333333-3333-3333-3333-333333333305', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201',
        'Anomali Suhu', 'Anomali Suhu 6.2°C', 'ONE_CLICK_REASSIGNMENT', 16.50, TRUE,
        'c7be1e6ffecbdf993ee3099710d0a793a388147d3c0fb8d4eb3f86e9270e5f29', 'Cold box switched to Budi thermal unit',
        '2026-09-24 13:42:00+07'
    ),
    (
        '88888888-8888-8888-8888-888888888803', 'AUD-TEB-2026-0012', '55555555-5555-5555-5555-555555555501',
        '33333333-3333-3333-3333-333333333302', '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201',
        'Mogok Kendaraan', 'Kopling Jebol / Mogok', 'ONE_CLICK_REASSIGNMENT', 19.80, TRUE,
        '3f4e2b1a09d8e7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2', 'Muatan berat 186.8kg dipindahkan ke armada Van Fajar',
        '2026-09-24 11:05:00+07'
    ),
    (
        '88888888-8888-8888-8888-888888888804', 'AUD-TEB-2026-0015', '55555555-5555-5555-5555-555555555507',
        '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201',
        'Ban Bocor', 'Ban Belakang Pecah', 'ONE_CLICK_REASSIGNMENT', 21.20, TRUE,
        '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'Obat resep BPOM dialihkan ke kurir bersertifikasi',
        '2026-09-24 09:18:00+07'
    ),
    (
        '88888888-8888-8888-8888-888888888805', 'AUD-TEB-2026-0088', '55555555-5555-5555-5555-555555555503',
        '33333333-3333-3333-3333-333333333307', '33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222201',
        'Cuaca / Hujan', 'Banjir Underpass Tebet', 'ONE_CLICK_REASSIGNMENT', 16.70, TRUE,
        '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', 'Rute dialihkan memutari titik genangan air',
        '2026-09-24 08:44:00+07'
    );

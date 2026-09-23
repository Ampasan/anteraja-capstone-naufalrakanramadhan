-- Bersihkan data lama jika ada (urutan penghapusan mematuhi hierarki Foreign Key)
TRUNCATE TABLE incident_reports, order_assignments, courier_telemetries, orders, couriers, users, hubs CASCADE;

-- ============================================================================
-- 1. SEED: hubs
-- ============================================================================
INSERT INTO hubs (id, hub_code, hub_name, city, latitude, longitude)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'HUB-JAKSEL-TEBET', 'Staging Hub Tebet', 'Jakarta Selatan', -6.225588, 106.855324),
    ('11111111-1111-1111-1111-111111111102', 'HUB-BDG-BATUNUNGGAL', 'Staging Hub Batununggal', 'Bandung', -6.953812, 107.627419),
    ('11111111-1111-1111-1111-111111111103', 'HUB-BKS-HARAPANINDAH', 'Staging Hub Harapan Indah', 'Bekasi', -6.180215, 106.984211),
    ('11111111-1111-1111-1111-111111111104', 'HUB-JAKBAR-KEBONJERUK', 'Staging Hub Kebon Jeruk', 'Jakarta Barat', -6.189512, 106.769941),
    ('11111111-1111-1111-1111-111111111105', 'HUB-JAKUT-SUNTER', 'Staging Hub Sunter', 'Jakarta Utara', -6.138472, 106.865419);

-- ============================================================================
-- 2. SEED: users
-- ============================================================================
INSERT INTO users (id, hub_id, name, email, role, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Siti Rahmawati', 'siti.tebet@anteraja.id', 'ADMIN_HUB', TRUE),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Budi Santoso Manager', 'budi.manager@anteraja.id', 'HUB_MANAGER', TRUE),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Dewi Lestari CC', 'dewi.cc@anteraja.id', 'CUSTOMER_CARE', TRUE);

-- ============================================================================
-- 3. SEED: couriers
-- ============================================================================
INSERT INTO couriers (id, courier_code, hub_id, name, phone_number, vehicle_type, status, is_bpom_certified, has_thermal_box)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'STR-BDG-004', '11111111-1111-1111-1111-111111111102', 'Indra Gunawan', '081234567801', 'Blind Van', 'ONLINE', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333302', 'STR-JKT-006', '11111111-1111-1111-1111-111111111102', 'Eko Prasetyo', '081234567802', 'Pick Up Box', 'ONLINE', FALSE, FALSE),
    ('33333333-3333-3333-3333-333333333303', 'STR-TGR-002', '11111111-1111-1111-1111-111111111105', 'Surya Darma', '081234567803', 'Van', 'ONLINE', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333304', 'STR-JKT-009', '11111111-1111-1111-1111-111111111104', 'Aris Munandar', '081234567804', 'Van', 'ONLINE', FALSE, TRUE),
    ('33333333-3333-3333-3333-333333333305', 'STR-JKT-001', '11111111-1111-1111-1111-111111111101', 'Budi Santoso', '081234567805', 'Motorcycle', 'ONLINE', FALSE, FALSE);

-- ============================================================================
-- 4. SEED: courier_telemetries
-- ============================================================================
INSERT INTO courier_telemetries (id, courier_id, latitude, longitude, speed_kmh, recorded_at)
VALUES
    -- Koordinat kurir Indra Gunawan terjebak macet (speed 0.00 memicu idle / warning)
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', -6.912403, 107.620154, 0.00, '2026-09-21 12:45:00+07'),
    -- Koordinat kurir Eko Prasetyo bergerak lancar di sekitar Bandung
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', -6.923100, 107.618400, 28.50, '2026-09-21 12:45:00+07'),
    -- Koordinat kurir Surya Darma membawa obat resep di Jakarta Utara
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333303', -6.160958, 106.846961, 15.20, '2026-09-20 02:39:00+07'),
    -- Koordinat kurir Aris Munandar membawa bahan pangan beku di Jakarta Barat
    ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333304', -6.177623, 106.757429, 32.10, '2026-09-20 21:23:00+07'),
    -- Koordinat kurir Budi Santoso di Tebet
    ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333305', -6.219597, 106.847922, 10.00, '2026-09-20 10:50:00+07');

-- ============================================================================
-- 5. SEED: orders
-- ============================================================================
INSERT INTO orders (
    id, order_number, hub_origin_id, current_courier_id, service_type, category, 
    weight_kg, dimension_length_cm, dimension_width_cm, dimension_height_cm, 
    special_handling, destination_address, destination_city, drop_latitude, drop_longitude, 
    order_time, pickup_time, delivery_time_minutes, sla_deadline, delivery_status, sla_status
)
VALUES
    -- Resi Skenario Utama Reassignment
    (
        '55555555-5555-5555-5555-555555555501', '100024000104', '11111111-1111-1111-1111-111111111102',
        '33333333-3333-3333-3333-333333333302', -- Kurir aktif saat ini (Eko Prasetyo setelah reassign)
        'Regular', 'Pakaian & Tekstil', 6.00, 30, 25, 20, 'Standard',
        'Jl. Ir. H. Juanda No. 88, Dago', 'Bandung', -6.890123, 107.610456,
        '2026-09-20 10:00:00+07', '2026-09-20 10:30:00+07', 1440, '2026-09-21 12:15:00+07',
        'In_Transit', 'BREACHED'
    ),
    -- Resi Instant
    (
        '55555555-5555-5555-5555-555555555502', '100024000000', '11111111-1111-1111-1111-111111111101',
        '33333333-3333-3333-3333-333333333305',
        'Instant', 'Kebutuhan Pokok Cepat', 2.90, 30, 23, 12, 'Instant_Direct',
        'Jl. Ir. H. Djuanda No. 120, RT 02/RW 07', 'Jakarta Selatan', -6.191771, 106.819609,
        '2026-09-20 10:35:00+07', '2026-09-20 10:50:00+07', 180, '2026-09-20 13:50:00+07',
        'Incident_Reported', 'BREACHED'
    ),
    -- Resi Layanan PHARMA
    (
        '55555555-5555-5555-5555-555555555503', '100024000006', '11111111-1111-1111-1111-111111111105',
        '33333333-3333-3333-3333-333333333303',
        'PHARMA', 'Obat Resep', 7.45, 28, 13, 18, 'BPOM_Pharma',
        'Jl. Gatot Subroto Kav. 22, RT 09/RW 03', 'Jakarta Utara', -6.174949, 106.829141,
        '2026-09-20 01:42:00+07', '2026-09-20 02:39:00+07', 720, '2026-09-20 14:39:00+07',
        'In_Transit', 'HIGH_RISK'
    ),
    -- Resi Layanan Frozen Cold Chain
    (
        '55555555-5555-5555-5555-555555555504', '100024000011', '11111111-1111-1111-1111-111111111104',
        '33333333-3333-3333-3333-333333333304',
        'Frozen', 'Buah & Sayuran Segar', 11.20, 26, 25, 22, 'Cold_Chain_-2_to_5C',
        'Jl. Raya Darmo No. 55, RT 04/RW 01', 'Jakarta Barat', -6.140324, 106.709534,
        '2026-09-20 20:26:00+07', '2026-09-20 21:23:00+07', 480, '2026-09-21 05:23:00+07',
        'In_Transit', 'SAFE'
    );

-- ============================================================================
-- 6. SEED: order_assignments (Membuktikan Relasi M:M & Audit Pengalihan Satu-Klik)
-- ============================================================================
INSERT INTO order_assignments (
    id, order_id, courier_id, assigned_by_user_id, assignment_status, reason, assigned_at, completed_at
)
VALUES
    -- Penugasan awal ke Indra Gunawan
    (
        '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 
        '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 
        'REASSIGNED', 'Terjebak macet total dan hujan deras di lokasi Dago', 
        '2026-09-20 10:00:00+07', '2026-09-21 12:45:18+07'
    ),
    -- Pengalihan Satu-Klik ke Eko Prasetyo
    (
        '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 
        '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 
        'ACTIVE', 'One-Click Task Reassignment eksekusi Admin Siti', 
        '2026-09-21 12:45:18+07', NULL
    ),
    -- Penugasan reguler untuk paket lainnya
    (
        '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', 
        '33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222201', 
        'ACTIVE', 'Penugasan rute reguler pagi', 
        '2026-09-20 10:35:00+07', NULL
    ),
    (
        '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555503', 
        '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', 
        'ACTIVE', 'Penugasan khusus kurir tersertifikasi BPOM', 
        '2026-09-20 01:42:00+07', NULL
    ),
    (
        '66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555504', 
        '33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222201', 
        'ACTIVE', 'Penugasan armada pendingin termal Frozen', 
        '2026-09-20 20:26:00+07', NULL
    );

-- ============================================================================
-- 7. SEED: incident_reports (Validasi Pelaporan Kendala Cepat & Resolusi).
-- ============================================================================
INSERT INTO incident_reports (
    id, order_id, courier_id, handled_by_user_id, incident_category, 
    weather_condition, traffic_condition, temperature_c, status, reported_at, resolved_at
)
VALUES
    -- Insiden macet & cuaca buruk paket 100024000104 (RESOLVED setelah reassign)
    (
        '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', 
        '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 
        'Traffic', 'Hujan Deras', 'Macet Total', NULL, 
        'RESOLVED', '2026-09-21 12:45:00+07', '2026-09-21 12:45:18+07'
    ),
    -- Insiden suhu muatan obat BPOM mendekati batas kritis (ACKNOWLEDGED)
    (
        '77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555503', 
        '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', 
        'Cold_Chain_Anomaly', 'Banjir', 'Sedang', 21.4, 
        'ACKNOWLEDGED', '2026-09-20 02:39:00+07', NULL
    );

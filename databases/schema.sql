-- Mengaktifkan ekstensi kriptografi untuk fungsi gen_random_uuid() bawaan PostgreSQL.
-- Supabase secara default mendukung pgcrypto untuk identifikasi UUID v4.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABEL: hubs (Staging Store / Kantor Operasional Hub)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_code VARCHAR(32) NOT NULL UNIQUE,       -- Format kode unik: HUB-JAKSEL-TEBET
    hub_name VARCHAR(100) NOT NULL,             -- Nama representatif hub operasional
    city VARCHAR(50) NOT NULL,                  -- Wilayah kota (Jakarta Selatan, Bandung, dll)
    latitude DECIMAL(10, 7) NOT NULL,           -- Titik lintang fisik hub (Store_Latitude)
    longitude DECIMAL(10, 7) NOT NULL,          -- Titik bujur fisik hub (Store_Longitude)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. TABEL: users (Petugas Internal & Pengguna Sistem)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN_HUB', 'HUB_MANAGER', 'CUSTOMER_CARE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABEL: couriers (Armada Kurir SATRIA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_code VARCHAR(32) NOT NULL UNIQUE,   -- Format: STR-JKT-001 (dari delivery.csv)
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(30) NOT NULL CHECK (
        vehicle_type IN (
            'Motorcycle', 'Scooter', 'Van', 'Blind Van', 
            'Cargo Truck', 'Pick Up Box', 'Cooler Box Van', 'Motor Listrik'
        )
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (
        status IN ('ONLINE', 'OFFLINE', 'IDLE', 'OFF_DUTY')
    ),
    is_bpom_certified BOOLEAN NOT NULL DEFAULT FALSE,
    has_thermal_box BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TABEL: courier_telemetries (Log Real-Time GPS & Sensor Kurir)
-- ============================================================================
CREATE TABLE IF NOT EXISTS courier_telemetries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,           -- Titik lintang GPS kurir terkini
    longitude DECIMAL(10, 7) NOT NULL,          -- Titik bujur GPS kurir terkini
    speed_kmh DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- Deteksi diam >10 menit (Idle Alert)
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABEL: orders (Transaksi & Pengiriman Paket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,   -- Nomor resi pengiriman (misal: 100024000000)
    hub_origin_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    current_courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    service_type VARCHAR(30) NOT NULL CHECK (
        service_type IN (
            'Instant', 'Same Day', 'Next Day', 'Regular', 
            'Cargo', 'Mini Cargo', 'Dokumen', 'PHARMA', 'Frozen'
        )
    ),
    category VARCHAR(50) NOT NULL,
    weight_kg DECIMAL(6, 2) NOT NULL,
    dimension_length_cm INT NOT NULL,
    dimension_width_cm INT NOT NULL,
    dimension_height_cm INT NOT NULL,
    special_handling VARCHAR(50) NOT NULL DEFAULT 'Standard',
    destination_address TEXT NOT NULL,
    destination_city VARCHAR(50) NOT NULL,
    drop_latitude DECIMAL(10, 7) NOT NULL,      -- Koordinat lintang tujuan (Drop_Latitude)
    drop_longitude DECIMAL(10, 7) NOT NULL,     -- Koordinat bujur tujuan (Drop_Longitude)
    order_time TIMESTAMPTZ NOT NULL,            -- Waktu paket terdaftar
    pickup_time TIMESTAMPTZ,                    -- Waktu paket dipickup fisik
    delivery_time_minutes INT NOT NULL,         -- Alokasi durasi standar SLA
    sla_deadline TIMESTAMPTZ NOT NULL,          -- Waktu jatuh tempo SLA absolut
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'Assigned' CHECK (
        delivery_status IN (
            'Pending_Pickup', 'Assigned', 'Picked_Up', 'In_Sorting_Hub', 
            'In_Transit', 'Out_For_Delivery', 'Delivered', 'Incident_Reported'
        )
    ),
    sla_status VARCHAR(20) NOT NULL DEFAULT 'SAFE' CHECK (
        sla_status IN ('SAFE', 'MEDIUM_RISK', 'HIGH_RISK', 'BREACHED', 'CRITICAL', 'ON_SCHEDULE')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. TABEL: order_assignments (Junction / Pivot Table M:M)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        assignment_status IN ('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED')
    ),
    reason TEXT,                                -- Catatan alasan pengalihan tugas
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 7. TABEL: incident_reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    handled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_category VARCHAR(40) NOT NULL CHECK (
        incident_category IN ('Weather', 'Traffic', 'Vehicle_Breakdown', 'Cold_Chain_Anomaly', 'Address_NotFound')
    ),
    weather_condition VARCHAR(30),              -- Contoh: 'Hujan Deras', 'Banjir'
    traffic_condition VARCHAR(30),              -- Contoh: 'Macet Total', 'Padat'
    temperature_c DECIMAL(4, 1),                -- Suhu sensor saat insiden (anomali jika >5°C)
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (
        status IN ('REPORTED', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED')
    ),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES UNTUK OPTIMASI QUERY & KINERJA API DASBOR
-- ============================================================================

-- Indeks filter order di dasbor Admin Hub berdasarkan SLA (F-02 Auto-Sort)
CREATE INDEX IF NOT EXISTS idx_orders_hub_origin_id ON orders(hub_origin_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_courier_id ON orders(current_courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_sla_deadline ON orders(sla_deadline ASC);
CREATE INDEX IF NOT EXISTS idx_orders_sla_status ON orders(sla_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- Indeks penelusuran telemetri GPS kurir tercepat (F-01 Live Tracking Map)
CREATE INDEX IF NOT EXISTS idx_telemetries_courier_time ON courier_telemetries(courier_id, recorded_at DESC);

-- Indeks validasi beban kerja kurir aktif < 20 paket (F-03 Reassignment Matching)
CREATE INDEX IF NOT EXISTS idx_couriers_hub_status ON couriers(hub_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_courier_active ON order_assignments(courier_id, assignment_status);
CREATE INDEX IF NOT EXISTS idx_assignments_order_id ON order_assignments(order_id);

-- Indeks pemantauan kendala aktif yang belum selesai (F-04 Quick Incident & Escalation)
CREATE INDEX IF NOT EXISTS idx_incidents_status_reported ON incident_reports(status, reported_at);

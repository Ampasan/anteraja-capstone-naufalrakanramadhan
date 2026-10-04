CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABEL: hubs
-- ============================================================================
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_code VARCHAR(32) NOT NULL UNIQUE,
    hub_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    service_radius_km DECIMAL(4, 1) NOT NULL DEFAULT 5.0,
    max_capacity_parcels INT NOT NULL DEFAULT 2850,
    current_parcels_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hubs_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_hubs_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_hubs_service_radius CHECK (service_radius_km > 0),
    CONSTRAINT chk_hubs_max_capacity CHECK (max_capacity_parcels > 0),
    CONSTRAINT chk_hubs_current_parcels CHECK (current_parcels_count >= 0 AND current_parcels_count <= max_capacity_parcels)
);

-- ============================================================================
-- 2. TABEL: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'SUSPENDED')),
    CONSTRAINT chk_users_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- ============================================================================
-- 3. TABEL: couriers
-- ============================================================================
CREATE TABLE IF NOT EXISTS couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_code VARCHAR(32) NOT NULL UNIQUE,
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    current_parcel_count INT NOT NULL DEFAULT 0,
    max_parcel_count INT NOT NULL DEFAULT 20,
    current_load_kg DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    max_capacity_kg DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
    current_address TEXT,
    is_bpom_certified BOOLEAN NOT NULL DEFAULT FALSE,
    has_thermal_box BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_couriers_status CHECK (status IN ('ONLINE', 'OFFLINE', 'IDLE', 'OFF_DUTY')),
    CONSTRAINT chk_couriers_parcel_count CHECK (current_parcel_count >= 0),
    CONSTRAINT chk_couriers_max_parcel CHECK (max_parcel_count > 0),
    CONSTRAINT chk_couriers_load CHECK (current_load_kg >= 0),
    CONSTRAINT chk_couriers_capacity CHECK (max_capacity_kg > 0),
    CONSTRAINT chk_couriers_parcel_max CHECK (current_parcel_count <= max_parcel_count),
    CONSTRAINT chk_couriers_load_max CHECK (current_load_kg <= max_capacity_kg)
);

-- ============================================================================
-- 4. TABEL: courier_telemetries
-- ============================================================================
CREATE TABLE IF NOT EXISTS courier_telemetries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed_kmh DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    temperature_c DECIMAL(4, 1),
    battery_level INT NOT NULL DEFAULT 100,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_telemetries_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_telemetries_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_telemetries_speed CHECK (speed_kmh >= 0),
    CONSTRAINT chk_telemetries_battery CHECK (battery_level BETWEEN 0 AND 100)
);

-- ============================================================================
-- 5. TABEL: orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    hub_origin_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    current_courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    service_type VARCHAR(30) NOT NULL,
    category VARCHAR(50) NOT NULL,
    weight_kg DECIMAL(8, 2) NOT NULL,
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    destination_address TEXT NOT NULL,
    destination_district VARCHAR(100),
    destination_city VARCHAR(50) NOT NULL,
    drop_latitude DECIMAL(10, 7) NOT NULL,
    drop_longitude DECIMAL(10, 7) NOT NULL,
    order_time TIMESTAMPTZ NOT NULL,
    pickup_time TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ NOT NULL,
    weather_condition VARCHAR(50),
    traffic_condition VARCHAR(50),
    temperature_c DECIMAL(4, 1),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_orders_service_type CHECK (service_type IN ('Instant', 'Same Day', 'Next Day', 'Regular', 'Cargo', 'Mini Cargo', 'Dokumen', 'PHARMA', 'Frozen')),
    CONSTRAINT chk_orders_weight CHECK (weight_kg > 0),
    CONSTRAINT chk_orders_sla_deadline CHECK (sla_deadline >= order_time),
    CONSTRAINT chk_orders_pickup_time CHECK (pickup_time IS NULL OR pickup_time >= order_time),
    CONSTRAINT chk_orders_drop_lat CHECK (drop_latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_orders_drop_lng CHECK (drop_longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_orders_delivery_status CHECK (delivery_status IN ('PENDING_PICKUP', 'ASSIGNED', 'PICKED_UP', 'IN_SORTING_HUB', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'))
);

-- ============================================================================
-- 6. TABEL: incident_reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(32) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    replacement_courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    handled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_category VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location_address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    weather_condition VARCHAR(50),
    traffic_condition VARCHAR(50),
    temperature_c DECIMAL(4, 1),
    evidence_image_url TEXT,
    evidence_public_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_incidents_category CHECK (incident_category IN ('Cuaca / Hujan', 'Anomali Suhu', 'Mogok Kendaraan', 'Ban Bocor', 'Alamat tidak ditemukan', 'Banjir', 'Macet Total')),
    CONSTRAINT chk_incidents_status CHECK (status IN ('REPORTED', 'ACKNOWLEDGED', 'REASSIGNING', 'RESOLVED', 'ESCALATED')),
    CONSTRAINT chk_incidents_replacement CHECK (replacement_courier_id IS NULL OR replacement_courier_id <> courier_id),
    CONSTRAINT chk_incidents_resolved CHECK (resolved_at IS NULL OR resolved_at >= reported_at),
    CONSTRAINT chk_incidents_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_incidents_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

-- ============================================================================
-- 6b. TABEL: incident_evidences
-- ============================================================================
CREATE TABLE IF NOT EXISTS incident_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    secure_url TEXT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TABEL: audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_code VARCHAR(32) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
    original_courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    replacement_courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    executor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_category VARCHAR(50) NOT NULL,
    incident_detail VARCHAR(150) NOT NULL,
    resolution_time_seconds DECIMAL(6, 2) NOT NULL,
    is_sla_saved BOOLEAN NOT NULL DEFAULT TRUE,
    audit_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_audit_logs_different_couriers CHECK (original_courier_id <> replacement_courier_id),
    CONSTRAINT chk_audit_logs_resolution_time CHECK (resolution_time_seconds >= 0)
);

-- ============================================================================
-- 7b. TABEL: reassignment_confirmations
-- ============================================================================
CREATE TABLE IF NOT EXISTS reassignment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmation_code VARCHAR(32) NOT NULL UNIQUE,
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    confirmation_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reassign_status CHECK (status IN ('CONFIRMED', 'CANCELLED', 'FAILED'))
);

-- ============================================================================
-- 8. TABEL: personal_access_tokens (Laravel Sanctum)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_id UUID NOT NULL,
    tokenable_type VARCHAR(255) NOT NULL,
    name TEXT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. TABEL: failed_jobs (Laravel Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES UNTUK OPTIMASI QUERY & KINERJA DASBOR REAL-TIME
-- ============================================================================

-- 1. Optimasi Filter & Pencarian Hub
CREATE INDEX IF NOT EXISTS idx_orders_hub_origin_id ON orders(hub_origin_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_courier_id ON orders(current_courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_sla_deadline ON orders(sla_deadline ASC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_hub_status_deadline ON orders(hub_origin_id, delivery_status, sla_deadline);
CREATE INDEX IF NOT EXISTS idx_orders_courier_status_deadline ON orders(current_courier_id, delivery_status, sla_deadline);

-- 2. Optimasi Panel Risiko SLA
CREATE INDEX IF NOT EXISTS idx_couriers_hub_status ON couriers(hub_id, status);
CREATE INDEX IF NOT EXISTS idx_couriers_hub_id ON couriers(hub_id);
CREATE INDEX IF NOT EXISTS idx_couriers_hub_status_available ON couriers(hub_id, status) WHERE status IN ('ONLINE', 'IDLE');

-- 3. Optimasi Peta Pemantauan Langsung
CREATE INDEX IF NOT EXISTS idx_telemetries_courier_time ON courier_telemetries(courier_id, recorded_at DESC);

-- 4. Optimasi Pusat Kendala & Antrean Inside
CREATE INDEX IF NOT EXISTS idx_incidents_code ON incident_reports(incident_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status_reported ON incident_reports(status, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_order_id ON incident_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_incidents_courier_id ON incident_reports(courier_id);
CREATE INDEX IF NOT EXISTS idx_incidents_replacement_courier_id ON incident_reports(replacement_courier_id);
CREATE INDEX IF NOT EXISTS idx_incident_evidences_incident_id ON incident_evidences(incident_id);

-- 5. Optimasi Riwayat Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(incident_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_executor ON audit_logs(executor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_incident_id ON audit_logs(incident_id);

-- 6. Optimasi Konfirmasi Reassignment 1-Klik
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_incident_id ON reassignment_confirmations(incident_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_order_id ON reassignment_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_status ON reassignment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_time ON reassignment_confirmations(confirmation_time);

-- 7. Optimasi Personal Access Tokens
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_expires_at ON personal_access_tokens(expires_at);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABEL: hubs
-- ============================================================================
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_code VARCHAR(32) NOT NULL UNIQUE,
    hub_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 7) NOT NULL, 
    longitude DECIMAL(10, 7) NOT NULL,
    service_radius_km DECIMAL(4, 1) NOT NULL DEFAULT 5.0 CHECK (service_radius_km > 0),
    max_capacity_parcels INT NOT NULL DEFAULT 2850 CHECK (max_capacity_parcels > 0),
    current_parcels_count INT NOT NULL DEFAULT 0 CHECK (
        current_parcels_count >= 0 AND current_parcels_count <= max_capacity_parcels
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
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
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN' CHECK (
        role IN ('ADMIN')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'LOCKED', 'SUSPENDED')
    ),
    failed_login_attempts INT NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    vehicle_type VARCHAR(50) NOT NULL CHECK (
        vehicle_type IN (
            'Motorcycle', 'Motorcycle thermal box', 'Motor Listrik',
            'Van', 'Blind Van', 'Pick Up Box', 'Truk', 'Truk Box', 'Cargo Truck', 'Cooler Box Van'
        )
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (
        status IN ('ONLINE', 'OFFLINE', 'IDLE', 'OFF_DUTY')
    ),
    current_parcel_count INT NOT NULL DEFAULT 0 CHECK (current_parcel_count >= 0),
    max_parcel_count INT NOT NULL DEFAULT 20 CHECK (max_parcel_count > 0),
    current_load_kg DECIMAL(8, 2) NOT NULL DEFAULT 0.00 CHECK (current_load_kg >= 0),
    max_capacity_kg DECIMAL(8, 2) NOT NULL DEFAULT 100.00 CHECK (max_capacity_kg > 0),
    current_address TEXT,
    is_bpom_certified BOOLEAN NOT NULL DEFAULT FALSE,
    has_thermal_box BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (current_parcel_count <= max_parcel_count),
    CHECK (current_load_kg <= max_capacity_kg)
);

-- ============================================================================
-- 4. TABEL: courier_telemetries
-- ============================================================================
CREATE TABLE IF NOT EXISTS courier_telemetries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed_kmh DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (speed_kmh >= 0),
    temperature_c DECIMAL(4, 1),
    battery_level INT NOT NULL DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

-- ============================================================================
-- 5. TABEL: orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    hub_origin_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    current_courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    service_type VARCHAR(30) NOT NULL CHECK (
        service_type IN (
            'Instant', 'Same Day', 'Next Day', 'Regular', 
            'Cargo', 'Mini Cargo', 'Dokumen', 'PHARMA', 'Frozen'
        )
    ),
    category VARCHAR(50) NOT NULL,
    weight_kg DECIMAL(8, 2) NOT NULL CHECK (weight_kg > 0),
    dimension_length_cm INT NOT NULL DEFAULT 20 CHECK (dimension_length_cm > 0),
    dimension_width_cm INT NOT NULL DEFAULT 20 CHECK (dimension_width_cm > 0),
    dimension_height_cm INT NOT NULL DEFAULT 20 CHECK (dimension_height_cm > 0),
    special_handling VARCHAR(50) NOT NULL DEFAULT 'Standard',
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    destination_address TEXT NOT NULL,
    destination_district VARCHAR(100),
    destination_city VARCHAR(50) NOT NULL,
    drop_latitude DECIMAL(10, 7) NOT NULL,
    drop_longitude DECIMAL(10, 7) NOT NULL,
    order_time TIMESTAMPTZ NOT NULL,
    pickup_time TIMESTAMPTZ,                      
    delivery_time_minutes INT NOT NULL CHECK (delivery_time_minutes > 0),
    sla_deadline TIMESTAMPTZ NOT NULL,            
    weather_condition VARCHAR(50),                 
    traffic_condition VARCHAR(50),                 
    temperature_c DECIMAL(4, 1),
    manifest_number VARCHAR(32),
    estimated_arrival_time TIMESTAMPTZ,
    remaining_distance_km DECIMAL(6, 2) CHECK (remaining_distance_km IS NULL OR remaining_distance_km >= 0),
    sla_risk_score DECIMAL(3, 1) CHECK (sla_risk_score IS NULL OR (sla_risk_score >= 0 AND sla_risk_score <= 10)),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED' CHECK (
        delivery_status IN (
            'PENDING_PICKUP', 'ASSIGNED', 'PICKED_UP', 'IN_SORTING_HUB',
            'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (sla_deadline >= order_time),
    CHECK (pickup_time IS NULL OR pickup_time >= order_time),
    CHECK (drop_latitude BETWEEN -90 AND 90),
    CHECK (drop_longitude BETWEEN -180 AND 180)
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
    incident_category VARCHAR(50) NOT NULL CHECK (
        incident_category IN (
            'Cuaca / Hujan', 'Anomali Suhu', 'Mogok Kendaraan', 'Ban Bocor', 'Alamat tidak ditemukan',
            'Banjir', 'Macet Total'
        )
    ),
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
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (
        status IN ('REPORTED', 'ACKNOWLEDGED', 'REASSIGNING', 'RESOLVED', 'ESCALATED')
    ),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    CHECK (replacement_courier_id IS NULL OR replacement_courier_id <> courier_id),
    CHECK (resolved_at IS NULL OR resolved_at >= reported_at),
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

-- ============================================================================
-- 6b. TABEL: incident_evidences
-- ============================================================================
CREATE TABLE IF NOT EXISTS incident_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    secure_url TEXT NOT NULL,
    folder VARCHAR(100) NOT NULL DEFAULT 'foto_bukti',
    file_format VARCHAR(20),
    file_size_bytes INT CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    caption TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TABEL: order_assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    incident_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        assignment_status IN ('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED')
    ),
    reason TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 7b. TABEL: order_tracking_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (
        event_type IN ('PICKUP', 'CHECKPOINT', 'ETA_UPDATE', 'DELIVERED', 'RETURNED')
    ),
    event_time TIMESTAMPTZ NOT NULL,
    location_description TEXT,
    manifest_number VARCHAR(32),
    sortation_gate VARCHAR(50),
    speed_kmh DECIMAL(5, 2) CHECK (speed_kmh IS NULL OR speed_kmh >= 0),
    traffic_condition VARCHAR(50),
    weather_condition VARCHAR(50),
    remaining_distance_km DECIMAL(6, 2) CHECK (remaining_distance_km IS NULL OR remaining_distance_km >= 0),
    estimated_arrival_time TIMESTAMPTZ,
    remaining_minutes INT CHECK (remaining_minutes IS NULL OR remaining_minutes >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7c. TABEL: delay_predictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS delay_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    weather_condition VARCHAR(50),
    traffic_condition VARCHAR(50),
    sla_risk_level VARCHAR(20) NOT NULL CHECK (
        sla_risk_level IN ('Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah')
    ),
    sla_risk_score DECIMAL(3, 1) NOT NULL CHECK (sla_risk_score >= 0 AND sla_risk_score <= 10),
    predicted_delay_minutes INT NOT NULL DEFAULT 0 CHECK (predicted_delay_minutes >= 0),
    analysis_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. TABEL: audit_logs
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
    action_type VARCHAR(50) NOT NULL DEFAULT 'ONE_CLICK_REASSIGNMENT',
    resolution_time_seconds DECIMAL(6, 2) NOT NULL CHECK (resolution_time_seconds >= 0),
    is_sla_saved BOOLEAN NOT NULL DEFAULT TRUE,    
    audit_hash VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (original_courier_id <> replacement_courier_id)
);

-- ============================================================================
-- 8b. TABEL: reassignment_confirmations
-- ============================================================================
CREATE TABLE IF NOT EXISTS reassignment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmation_code VARCHAR(32) NOT NULL UNIQUE,
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    original_courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    replacement_courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
    confirmed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmation_method VARCHAR(20) DEFAULT 'ONE_CLICK' CHECK (
        confirmation_method IN ('ONE_CLICK', 'MANUAL')
    ),
    confirmation_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_resolution_seconds INT,
    actual_resolution_seconds INT,
    is_sla_saved BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED', 'FAILED')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (original_courier_id <> replacement_courier_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_incident_courier_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM orders
        WHERE id = NEW.order_id
          AND current_courier_id = NEW.courier_id
    ) THEN
        RAISE EXCEPTION 'incident courier must match the order current courier';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hubs_set_updated_at ON hubs;
CREATE TRIGGER trg_hubs_set_updated_at
BEFORE UPDATE ON hubs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_couriers_set_updated_at ON couriers;
CREATE TRIGGER trg_couriers_set_updated_at
BEFORE UPDATE ON couriers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON orders;
CREATE TRIGGER trg_orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_incident_reports_validate_courier ON incident_reports;
CREATE TRIGGER trg_incident_reports_validate_courier
BEFORE INSERT OR UPDATE OF order_id, courier_id ON incident_reports
FOR EACH ROW EXECUTE FUNCTION validate_incident_courier_assignment();

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_delay_predictions_set_updated_at ON delay_predictions;
CREATE TRIGGER trg_delay_predictions_set_updated_at
BEFORE UPDATE ON delay_predictions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reassignment_confirmations_set_updated_at ON reassignment_confirmations;
CREATE TRIGGER trg_reassignment_confirmations_set_updated_at
BEFORE UPDATE ON reassignment_confirmations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- INDEXES UNTUK OPTIMASI QUERY & KINERJA DASBOR REAL-TIME
-- ============================================================================

-- 1. Optimasi Filter & Pencarian Hub
CREATE INDEX IF NOT EXISTS idx_orders_hub_origin_id ON orders(hub_origin_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_courier_id ON orders(current_courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- 2. Optimasi Panel Risiko SLA
CREATE INDEX IF NOT EXISTS idx_orders_sla_deadline ON orders(sla_deadline ASC);

-- 3. Optimasi Peta Pemantauan Langsung
CREATE INDEX IF NOT EXISTS idx_couriers_hub_status ON couriers(hub_id, status);
CREATE INDEX IF NOT EXISTS idx_telemetries_courier_time ON courier_telemetries(courier_id, recorded_at DESC);

-- 4. Optimasi Pusat Kendala & Antrean Inside
CREATE INDEX IF NOT EXISTS idx_incidents_code ON incident_reports(incident_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status_reported ON incident_reports(status, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_order_id ON incident_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_incident_evidences_incident_id ON incident_evidences(incident_id);
CREATE INDEX IF NOT EXISTS idx_assignments_courier_active ON order_assignments(courier_id, assignment_status);
CREATE INDEX IF NOT EXISTS idx_assignments_order_id ON order_assignments(order_id);
-- Satu order hanya boleh memiliki satu kurir penugasan yang masih aktif.
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_assignments_active_order
    ON order_assignments(order_id)
    WHERE assignment_status = 'ACTIVE';

-- 5. Optimasi Riwayat Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(incident_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_executor ON audit_logs(executor_user_id);

-- 6. Optimasi Timeline Tracking & Prediksi Keterlambatan
CREATE INDEX IF NOT EXISTS idx_tracking_events_order_id ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_time ON order_tracking_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_delay_predictions_order_id ON delay_predictions(order_id);
CREATE INDEX IF NOT EXISTS idx_delay_predictions_risk_score ON delay_predictions(sla_risk_score DESC);

-- 7. Optimasi Konfirmasi Reassignment 1-Klik
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_incident_id ON reassignment_confirmations(incident_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_order_id ON reassignment_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_status ON reassignment_confirmations(status);

-- ============================================================================
-- VIEWS: KEMUDAHAN QUERY KPI & INTEGRASI UI DASBOR
-- ============================================================================

-- View 1: Data Tabel SLA Risk Indicator Panel
DROP VIEW IF EXISTS v_sla_risk_panel;
CREATE OR REPLACE VIEW v_sla_risk_panel AS
WITH sla_orders AS (
    SELECT
        o.*,
        FLOOR(EXTRACT(EPOCH FROM (o.sla_deadline - NOW())) / 60)::INT AS sla_remaining_minutes
    FROM orders o
)
SELECT 
    o.id AS order_id,
    o.order_number,
    o.service_type,
    o.destination_address,
    o.destination_district,
    o.destination_city,
    COALESCE(
        CASE 
            WHEN o.service_type = 'Frozen' AND o.temperature_c IS NOT NULL 
                THEN 'Suhu Box: ' || o.temperature_c || '°C'
            WHEN o.weather_condition IS NOT NULL AND o.traffic_condition IS NOT NULL
                THEN o.weather_condition || ' & ' || o.traffic_condition
            WHEN o.weather_condition IS NOT NULL 
                THEN o.weather_condition
            WHEN o.traffic_condition IS NOT NULL 
                THEN o.traffic_condition
            ELSE 'Normal Lancar'
        END, 'Normal Lancar'
    ) AS keadaan,
    o.sla_remaining_minutes,
    CASE
        WHEN o.sla_remaining_minutes < 0 THEN 'BREACHED'
        WHEN o.sla_remaining_minutes < 15 THEN 'HIGH_RISK'
        WHEN o.sla_remaining_minutes <= 30 THEN 'MEDIUM_RISK'
        ELSE 'SAFE'
    END AS sla_status,
    o.drop_latitude,
    o.drop_longitude,
    o.current_courier_id,
    c.name AS courier_name,
    c.courier_code
FROM sla_orders o
LEFT JOIN couriers c ON o.current_courier_id = c.id
WHERE o.delivery_status NOT IN ('DELIVERED', 'RETURNED');

-- View 2: Data Audit Log & Riwayat Operasional
CREATE OR REPLACE VIEW v_audit_logs_history AS
SELECT 
    al.id AS log_id,
    al.log_code,
    o.order_number,
    o.service_type,
    al.created_at AS waktu_selesai,
    orig.name AS original_courier_name,
    orig.courier_code AS original_courier_code,
    repl.name AS replacement_courier_name,
    repl.courier_code AS replacement_courier_code,
    al.incident_category,
    al.incident_detail AS jenis_kendala,
    al.resolution_time_seconds,
    al.is_sla_saved,
    u.name AS executor_name
FROM audit_logs al
JOIN orders o ON al.order_id = o.id
JOIN couriers orig ON al.original_courier_id = orig.id
JOIN couriers repl ON al.replacement_courier_id = repl.id
LEFT JOIN users u ON al.executor_user_id = u.id;

-- View 3: Data Pemantauan Insiden Lapangan & Foto Bukti Cloudinary
DROP VIEW IF EXISTS v_incident_monitoring_center;
CREATE OR REPLACE VIEW v_incident_monitoring_center AS
SELECT 
    ir.id AS incident_id,
    ir.incident_code,
    ir.status,
    ir.incident_category,
    ir.title,
    ir.description,
    ir.location_address,
    ir.latitude,
    ir.longitude,
    ir.weather_condition,
    ir.traffic_condition,
    ir.temperature_c,
    ir.evidence_image_url,
    ir.evidence_public_id,
    o.order_number,
    o.service_type,
    o.destination_address,
    c.courier_code AS reporter_courier_code,
    c.name AS reporter_courier_name,
    c.vehicle_type AS reporter_vehicle_type,
    rc.courier_code AS replacement_courier_code,
    rc.name AS replacement_courier_name,
    u.name AS handled_by_name,
    ir.reported_at,
    ir.resolved_at
FROM incident_reports ir
JOIN orders o ON ir.order_id = o.id
JOIN couriers c ON ir.courier_id = c.id
LEFT JOIN couriers rc ON ir.replacement_courier_id = rc.id
LEFT JOIN users u ON ir.handled_by_user_id = u.id;

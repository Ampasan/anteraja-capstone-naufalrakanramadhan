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
    max_capacity_parcels INT NOT NULL DEFAULT 2850,
    current_parcels_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    failed_login_attempts INT NOT NULL DEFAULT 0, 
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
    vehicle_type VARCHAR(50) NOT NULL CHECK (
        vehicle_type IN (
            'Motorcycle', 'Motorcycle thermal box', 'Motor Listrik',
            'Van', 'Blind Van', 'Pick Up Box', 'Truk', 'Truk Box', 'Cargo Truck', 'Cooler Box Van'
        )
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (
        status IN ('ONLINE', 'OFFLINE', 'IDLE', 'OFF_DUTY')
    ),
    current_parcel_count INT NOT NULL DEFAULT 0,
    max_parcel_count INT NOT NULL DEFAULT 20,
    current_load_kg DECIMAL(8, 2) NOT NULL DEFAULT 0.00, 
    max_capacity_kg DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
    current_address TEXT,
    is_bpom_certified BOOLEAN NOT NULL DEFAULT FALSE,
    has_thermal_box BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    battery_level INT DEFAULT 100,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    weight_kg DECIMAL(8, 2) NOT NULL,
    dimension_length_cm INT NOT NULL DEFAULT 20,
    dimension_width_cm INT NOT NULL DEFAULT 20,
    dimension_height_cm INT NOT NULL DEFAULT 20,
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
    delivery_time_minutes INT NOT NULL,            
    sla_deadline TIMESTAMPTZ NOT NULL,            
    sla_remaining_minutes INT NOT NULL DEFAULT 60, 
    weather_condition VARCHAR(50),                 
    traffic_condition VARCHAR(50),                 
    temperature_c DECIMAL(4, 1),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'Assigned' CHECK (
        delivery_status IN (
            'Pending_Pickup', 'Assigned', 'Picked_Up', 'In_Sorting_Hub', 
            'In_Transit', 'Out_For_Delivery', 'Delivered', 'Incident_Reported', 'Returned'
        )
    ),
    sla_status VARCHAR(20) NOT NULL DEFAULT 'SAFE' CHECK (
        sla_status IN (
            'KRITIS', 'WASPADA', 'AMAN',
            'SAFE', 'MEDIUM_RISK', 'HIGH_RISK', 'BREACHED', 'CRITICAL', 'ON_SCHEDULE'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (
        status IN ('REPORTED', 'ACKNOWLEDGED', 'REASSIGNING', 'RESOLVED', 'ESCALATED')
    ),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
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
    resolution_time_seconds DECIMAL(6, 2) NOT NULL DEFAULT 18.40, 
    is_sla_saved BOOLEAN NOT NULL DEFAULT TRUE,    
    audit_hash VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES UNTUK OPTIMASI QUERY & KINERJA DASBOR REAL-TIME
-- ============================================================================

-- 1. Optimasi Filter & Pencarian Resi / Hub
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_hub_origin_id ON orders(hub_origin_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_courier_id ON orders(current_courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- 2. Optimasi Panel Risiko SLA (F-02 Auto-Sort & Filter Status)
CREATE INDEX IF NOT EXISTS idx_orders_sla_deadline ON orders(sla_deadline ASC);
CREATE INDEX IF NOT EXISTS idx_orders_sla_remaining ON orders(sla_remaining_minutes ASC);
CREATE INDEX IF NOT EXISTS idx_orders_sla_status ON orders(sla_status);

-- 3. Optimasi Peta Pemantauan Langsung (F-01 Live Tracking & Telemetri Tercepat)
CREATE INDEX IF NOT EXISTS idx_couriers_hub_status ON couriers(hub_id, status);
CREATE INDEX IF NOT EXISTS idx_couriers_license_plate ON couriers(license_plate);
CREATE INDEX IF NOT EXISTS idx_telemetries_courier_time ON courier_telemetries(courier_id, recorded_at DESC);

-- 4. Optimasi Pusat Kendala & Antrean Insiden (F-03 Incident & Reassignment)
CREATE INDEX IF NOT EXISTS idx_incidents_code ON incident_reports(incident_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status_reported ON incident_reports(status, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_order_id ON incident_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_courier_active ON order_assignments(courier_id, assignment_status);
CREATE INDEX IF NOT EXISTS idx_assignments_order_id ON order_assignments(order_id);

-- 5. Optimasi Riwayat Audit Log (F-04 Audit Log & Search Multi-Parameter)
CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(incident_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_executor ON audit_logs(executor_user_id);

-- ============================================================================
-- VIEWS: KEMUDAHAN QUERY KPI & INTEGRASI UI DASBOR
-- ============================================================================

-- View 1: Data Tabel SLA Risk Indicator Panel
CREATE OR REPLACE VIEW v_sla_risk_panel AS
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
        WHEN o.sla_remaining_minutes < 15 THEN 'KRITIS'
        WHEN o.sla_remaining_minutes BETWEEN 15 AND 30 THEN 'WASPADA'
        ELSE 'AMAN'
    END AS visual_sla_status,
    o.drop_latitude,
    o.drop_longitude,
    o.current_courier_id,
    c.name AS courier_name,
    c.courier_code
FROM orders o
LEFT JOIN couriers c ON o.current_courier_id = c.id
WHERE o.delivery_status NOT IN ('Delivered', 'Returned');

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

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tambahkan composite index untuk optimasi query production.
     */
    public function up(): void
    {
        // Index untuk SLA Risk Panel query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_orders_hub_status_deadline 
            ON orders(hub_origin_id, delivery_status, sla_deadline)');

        // Index untuk couriers available query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_couriers_hub_status_available 
            ON couriers(hub_id, status) 
            WHERE status IN (\'ONLINE\', \'IDLE\')');

        // Index untuk incident reports query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_incidents_status_reported 
            ON incident_reports(status, reported_at DESC)');

        // Index untuk audit logs query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
            ON audit_logs(created_at DESC)');

        // Index untuk order assignments query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_assignments_courier_status 
            ON order_assignments(courier_id, assignment_status)');

        // Index untuk tracking events query
        DB::statement('CREATE INDEX IF NOT EXISTS idx_tracking_events_order_time 
            ON order_tracking_events(order_id, event_time DESC)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_orders_hub_status_deadline');
        DB::statement('DROP INDEX IF EXISTS idx_couriers_hub_status_available');
        DB::statement('DROP INDEX IF EXISTS idx_incidents_status_reported');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_created_at');
        DB::statement('DROP INDEX IF EXISTS idx_assignments_courier_status');
        DB::statement('DROP INDEX IF EXISTS idx_tracking_events_order_time');
    }
};

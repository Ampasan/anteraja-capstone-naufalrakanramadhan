<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel incident_reports: Laporan kendala kurir.
     * 2 insiden aktif untuk Incident & Reassign.
     */
    public function up(): void
    {
        Schema::create('incident_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('incident_code', 32)->unique();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('courier_id')->constrained('couriers')->restrictOnDelete();
            $table->foreignUuid('replacement_courier_id')->nullable()->constrained('couriers')->nullOnDelete();
            $table->foreignUuid('handled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('incident_category', 50);
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->text('location_address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('weather_condition', 50)->nullable();
            $table->string('traffic_condition', 50)->nullable();
            $table->decimal('temperature_c', 4, 1)->nullable();
            $table->text('evidence_image_url')->nullable();
            $table->string('evidence_public_id', 255)->nullable();
            $table->string('status', 20)->default('REPORTED');
            $table->timestamp('reported_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_category CHECK (incident_category IN ('Cuaca / Hujan', 'Anomali Suhu', 'Mogok Kendaraan', 'Ban Bocor', 'Alamat tidak ditemukan', 'Banjir', 'Macet Total'))");
        DB::statement("ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_status CHECK (status IN ('REPORTED', 'ACKNOWLEDGED', 'REASSIGNING', 'RESOLVED', 'ESCALATED'))");
        DB::statement('ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_replacement CHECK (replacement_courier_id IS NULL OR replacement_courier_id <> courier_id)');
        DB::statement('ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_resolved CHECK (resolved_at IS NULL OR resolved_at >= reported_at)');
        DB::statement('ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)');
        DB::statement('ALTER TABLE incident_reports ADD CONSTRAINT chk_incidents_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)');

        // Index untuk optimasi
        DB::statement('CREATE INDEX idx_incidents_code ON incident_reports(incident_code)');
        DB::statement('CREATE INDEX idx_incidents_status_reported ON incident_reports(status, reported_at DESC)');
        DB::statement('CREATE INDEX idx_incidents_order_id ON incident_reports(order_id)');

        // Tambahkan foreign key incident_id ke order_assignments sekarang bahwa tabel incident_reports sudah ada
        DB::statement('ALTER TABLE order_assignments ADD CONSTRAINT fk_assignments_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_reports');
    }
};

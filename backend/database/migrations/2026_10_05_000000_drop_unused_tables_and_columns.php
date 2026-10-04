<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pembersihan skema untuk database Supabase yang sudah berjalan.
 *
 * Migration pembuatan di belakangnya sudah disunting, jadi instalasi BARU
 * tidak pernah membuat tabel/kolom di bawah. Migration ini yang melepasnya
 * dari database yang sudah ada — jalankan `php artisan migrate`.
 *
 * Semua yang dibuang tidak pernah dibaca oleh frontend, backend, maupun
 * dokumen requirement (FRD/PRD):
 *
 *   - order_tracking_events, delay_predictions — tabel mati, nol referensi.
 *   - order_assignments — hanya ditulis, tidak pernah dibaca; logika
 *     penulisannya sudah dilepas dari alur reassign.
 *   - sessions, cache, cache_locks, jobs, job_batches — selalu kosong karena
 *     SESSION_DRIVER, CACHE_STORE, dan QUEUE_CONNECTION memakai redis.
 *   - 24 kolom write-only (lihat COLUMNS) di 5 tabel yang tetap dipakai.
 *
 * failed_jobs TIDAK disentuh: QUEUE_FAILED_DRIVER=database-uuids menulis ke
 * sana dan GET /api/health membacanya. Kolom bertanda proteksi (service_type,
 * vehicle_type, seluruh kolom status, incident_category) juga tidak disentuh.
 */
return new class extends Migration
{
    /**
     * Kolom yang dilepas per tabel. Sifatnya write-only: tidak pernah dibaca
     * kode aplikasi maupun ditampilkan frontend.
     */
    private const COLUMNS = [
        'hubs' => [
            'address',
        ],
        'orders' => [
            'dimension_length_cm', 'dimension_width_cm', 'dimension_height_cm',
            'special_handling', 'delivery_time_minutes', 'manifest_number',
            'estimated_arrival_time', 'remaining_distance_km', 'sla_risk_score',
        ],
        'incident_evidences' => [
            'folder', 'file_format', 'file_size_bytes',
        ],
        'audit_logs' => [
            'action_type', 'notes', 'updated_at',
        ],
        'reassignment_confirmations' => [
            'original_courier_id', 'replacement_courier_id', 'confirmed_by_user_id',
            'confirmation_method', 'estimated_resolution_seconds',
            'actual_resolution_seconds', 'is_sla_saved', 'notes',
        ],
    ];

    /** Tabel yang dilepas (lihat docblock di atas). */
    private const TABLES = [
        'order_tracking_events',
        'delay_predictions',
        'order_assignments',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
    ];

    public function up(): void
    {
        foreach (self::COLUMNS as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            // PostgreSQL menjatuhkan sendiri index/check constraint yang
            // melibatkan kolom yang dihapus, jadi cukup drop kolomnya.
            $existing = array_values(array_intersect($columns, Schema::getColumnListing($table)));
            if ($existing !== []) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropColumn($existing));
            }
        }

        foreach (self::TABLES as $table) {
            Schema::dropIfExists($table);
        }
    }

    public function down(): void
    {
        $this->restoreColumns();
        $this->restoreTables();
    }

    /** Kembalikan 24 kolom yang dilepas up() beserta constraint-nya. */
    private function restoreColumns(): void
    {
        if (Schema::hasTable('hubs')) {
            Schema::table('hubs', function (Blueprint $table) {
                $table->text('address')->nullable()->after('city');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->integer('dimension_length_cm')->default(20)->after('weight_kg');
                $table->integer('dimension_width_cm')->default(20)->after('dimension_length_cm');
                $table->integer('dimension_height_cm')->default(20)->after('dimension_width_cm');
                $table->string('special_handling', 50)->default('Standard')->after('dimension_height_cm');
                $table->integer('delivery_time_minutes')->after('pickup_time');
                $table->string('manifest_number', 32)->nullable()->after('temperature_c');
                $table->timestamp('estimated_arrival_time')->nullable()->after('manifest_number');
                $table->decimal('remaining_distance_km', 6, 2)->nullable()->after('estimated_arrival_time');
                $table->decimal('sla_risk_score', 3, 1)->nullable()->after('remaining_distance_km');
            });

            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery_time CHECK (delivery_time_minutes > 0)');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_sla_score CHECK (sla_risk_score IS NULL OR (sla_risk_score >= 0 AND sla_risk_score <= 10))');
        }

        if (Schema::hasTable('incident_evidences')) {
            Schema::table('incident_evidences', function (Blueprint $table) {
                $table->string('folder', 100)->default('foto_bukti')->after('secure_url');
                $table->string('file_format', 20)->nullable()->after('folder');
                $table->integer('file_size_bytes')->nullable()->after('file_format');
            });

            DB::statement('ALTER TABLE incident_evidences ADD CONSTRAINT chk_evidences_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)');
        }

        if (Schema::hasTable('audit_logs')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('action_type', 50)->default('ONE_CLICK_REASSIGNMENT')->after('incident_detail');
                $table->text('notes')->nullable()->after('audit_hash');
                $table->timestamp('updated_at')->nullable()->after('created_at');
            });
        }

        if (Schema::hasTable('reassignment_confirmations')) {
            Schema::table('reassignment_confirmations', function (Blueprint $table) {
                $table->foreignUuid('original_courier_id')->constrained('couriers')->restrictOnDelete()->after('order_id');
                $table->foreignUuid('replacement_courier_id')->constrained('couriers')->restrictOnDelete()->after('original_courier_id');
                $table->foreignUuid('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('replacement_courier_id');
                $table->string('confirmation_method', 20)->default('ONE_CLICK')->after('confirmed_by_user_id');
                $table->integer('estimated_resolution_seconds')->nullable()->after('confirmation_time');
                $table->integer('actual_resolution_seconds')->nullable()->after('estimated_resolution_seconds');
                $table->boolean('is_sla_saved')->default(true)->after('actual_resolution_seconds');
                $table->text('notes')->nullable()->after('status');
            });

            DB::statement("ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_method CHECK (confirmation_method IN ('ONE_CLICK', 'MANUAL'))");
            DB::statement('ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_different_couriers CHECK (original_courier_id <> replacement_courier_id)');
        }
    }

    /** Kembalikan 8 tabel yang dilepas up(), persis seperti definisi aslinya. */
    private function restoreTables(): void
    {
        Schema::create('order_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('courier_id')->constrained('couriers')->restrictOnDelete();
            $table->uuid('incident_id')->nullable();
            $table->foreignUuid('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('assignment_status', 20)->default('ACTIVE');
            $table->text('reason')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE order_assignments ADD CONSTRAINT chk_assignments_status CHECK (assignment_status IN ('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED'))");
        DB::statement('CREATE INDEX idx_assignments_courier_active ON order_assignments(courier_id, assignment_status)');
        DB::statement('CREATE INDEX idx_assignments_order_id ON order_assignments(order_id)');
        DB::statement("CREATE UNIQUE INDEX uq_order_assignments_active_order ON order_assignments(order_id) WHERE assignment_status = 'ACTIVE'");
        DB::statement('CREATE INDEX IF NOT EXISTS idx_assignments_courier_status ON order_assignments(courier_id, assignment_status)');
        if (Schema::hasTable('incident_reports')) {
            DB::statement('ALTER TABLE order_assignments ADD CONSTRAINT fk_assignments_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL');
        }

        Schema::create('order_tracking_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('event_type', 30);
            $table->timestamp('event_time');
            $table->text('location_description')->nullable();
            $table->string('manifest_number', 32)->nullable();
            $table->string('sortation_gate', 50)->nullable();
            $table->decimal('speed_kmh', 5, 2)->nullable();
            $table->string('traffic_condition', 50)->nullable();
            $table->string('weather_condition', 50)->nullable();
            $table->decimal('remaining_distance_km', 6, 2)->nullable();
            $table->timestamp('estimated_arrival_time')->nullable();
            $table->integer('remaining_minutes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
        DB::statement("ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_event_type CHECK (event_type IN ('PICKUP', 'CHECKPOINT', 'ETA_UPDATE', 'DELIVERED', 'RETURNED'))");
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_speed CHECK (speed_kmh IS NULL OR speed_kmh >= 0)');
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_distance CHECK (remaining_distance_km IS NULL OR remaining_distance_km >= 0)');
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_remaining CHECK (remaining_minutes IS NULL OR remaining_minutes >= 0)');
        DB::statement('CREATE INDEX idx_tracking_events_order_id ON order_tracking_events(order_id)');
        DB::statement('CREATE INDEX idx_tracking_events_event_time ON order_tracking_events(event_time DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_tracking_events_order_time ON order_tracking_events(order_id, event_time DESC)');

        Schema::create('delay_predictions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('weather_condition', 50)->nullable();
            $table->string('traffic_condition', 50)->nullable();
            $table->string('sla_risk_level', 20);
            $table->decimal('sla_risk_score', 3, 1);
            $table->integer('predicted_delay_minutes')->default(0);
            $table->text('analysis_summary')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_risk_level CHECK (sla_risk_level IN ('Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah'))");
        DB::statement('ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_risk_score CHECK (sla_risk_score >= 0 AND sla_risk_score <= 10)');
        DB::statement('ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_predicted CHECK (predicted_delay_minutes >= 0)');
        DB::statement('CREATE INDEX idx_delay_predictions_order_id ON delay_predictions(order_id)');
        DB::statement('CREATE INDEX idx_delay_predictions_risk_score ON delay_predictions(sla_risk_score DESC)');

        // Tabel infra yang awalnya ikut dibuat migration 2026_10_01_080000.
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }
};

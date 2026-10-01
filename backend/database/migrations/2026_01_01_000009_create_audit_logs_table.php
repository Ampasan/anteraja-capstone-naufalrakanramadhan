<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel audit_logs: Jejak audit pengalihan tugas (immutable).
     * 5 data audit log untuk riwayat.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('log_code', 32)->unique();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('incident_id')->nullable()->constrained('incident_reports')->nullOnDelete();
            $table->foreignUuid('original_courier_id')->constrained('couriers')->restrictOnDelete();
            $table->foreignUuid('replacement_courier_id')->constrained('couriers')->restrictOnDelete();
            $table->foreignUuid('executor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('incident_category', 50);
            $table->string('incident_detail', 150);
            $table->string('action_type', 50)->default('ONE_CLICK_REASSIGNMENT');
            $table->decimal('resolution_time_seconds', 6, 2);
            $table->boolean('is_sla_saved')->default(true);
            $table->string('audit_hash', 64)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        // Check constraints
        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_different_couriers CHECK (original_courier_id <> replacement_courier_id)');
        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_resolution_time CHECK (resolution_time_seconds >= 0)');

        // Index untuk optimasi
        DB::statement('CREATE INDEX idx_audit_logs_order_id ON audit_logs(order_id)');
        DB::statement('CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)');
        DB::statement('CREATE INDEX idx_audit_logs_category ON audit_logs(incident_category)');
        DB::statement('CREATE INDEX idx_audit_logs_executor ON audit_logs(executor_user_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

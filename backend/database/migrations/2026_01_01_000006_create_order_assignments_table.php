<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel order_assignments: Riwayat penugasan kurir ke order.
     * Satu order hanya boleh memiliki satu assignment ACTIVE.
     */
    public function up(): void
    {
        Schema::create('order_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('courier_id')->constrained('couriers')->restrictOnDelete();
            // Foreign key incident_id ditambahkan di migration incident_reports (urutan tabel)
            $table->uuid('incident_id')->nullable();
            $table->foreignUuid('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('assignment_status', 20)->default('ACTIVE');
            $table->text('reason')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE order_assignments ADD CONSTRAINT chk_assignments_status CHECK (assignment_status IN ('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED'))");

        // Index untuk optimasi
        DB::statement('CREATE INDEX idx_assignments_courier_active ON order_assignments(courier_id, assignment_status)');
        DB::statement('CREATE INDEX idx_assignments_order_id ON order_assignments(order_id)');
        // Satu order hanya boleh memiliki satu assignment ACTIVE
        DB::statement("CREATE UNIQUE INDEX uq_order_assignments_active_order ON order_assignments(order_id) WHERE assignment_status = 'ACTIVE'");
    }

    public function down(): void
    {
        Schema::dropIfExists('order_assignments');
    }
};

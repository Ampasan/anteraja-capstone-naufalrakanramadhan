<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel reassignment_confirmations: Konfirmasi pengalihan 1-klik.
     */
    public function up(): void
    {
        Schema::create('reassignment_confirmations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('confirmation_code', 32)->unique();
            $table->foreignUuid('incident_id')->constrained('incident_reports')->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('original_courier_id')->constrained('couriers')->restrictOnDelete();
            $table->foreignUuid('replacement_courier_id')->constrained('couriers')->restrictOnDelete();
            $table->foreignUuid('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('confirmation_method', 20)->default('ONE_CLICK');
            $table->timestamp('confirmation_time')->useCurrent();
            $table->integer('estimated_resolution_seconds')->nullable();
            $table->integer('actual_resolution_seconds')->nullable();
            $table->boolean('is_sla_saved')->default(true);
            $table->string('status', 20)->default('CONFIRMED');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_method CHECK (confirmation_method IN ('ONE_CLICK', 'MANUAL'))");
        DB::statement("ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_status CHECK (status IN ('CONFIRMED', 'CANCELLED', 'FAILED'))");
        DB::statement('ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_different_couriers CHECK (original_courier_id <> replacement_courier_id)');

        // Index untuk optimasi
        DB::statement('CREATE INDEX idx_reassignment_confirmations_incident_id ON reassignment_confirmations(incident_id)');
        DB::statement('CREATE INDEX idx_reassignment_confirmations_order_id ON reassignment_confirmations(order_id)');
        DB::statement('CREATE INDEX idx_reassignment_confirmations_status ON reassignment_confirmations(status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reassignment_confirmations');
    }
};

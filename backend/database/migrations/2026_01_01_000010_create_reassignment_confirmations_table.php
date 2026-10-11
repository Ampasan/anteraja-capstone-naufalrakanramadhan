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
            $table->timestamp('confirmation_time')->useCurrent();
            $table->string('status', 20)->default('CONFIRMED');
            $table->timestamps();
        });

        // Check constraints. SQLite tidak mendukung ALTER ADD CONSTRAINT,
        // jadi driver itu melewati blok ini (hanya dipakai test).
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE reassignment_confirmations ADD CONSTRAINT chk_reassign_status CHECK (status IN ('CONFIRMED', 'CANCELLED', 'FAILED'))");
        }

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

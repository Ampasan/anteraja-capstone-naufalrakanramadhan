<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel order_tracking_events: Timeline tracking pengiriman.
     */
    public function up(): void
    {
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

        // Check constraints
        DB::statement("ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_event_type CHECK (event_type IN ('PICKUP', 'CHECKPOINT', 'ETA_UPDATE', 'DELIVERED', 'RETURNED'))");
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_speed CHECK (speed_kmh IS NULL OR speed_kmh >= 0)');
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_distance CHECK (remaining_distance_km IS NULL OR remaining_distance_km >= 0)');
        DB::statement('ALTER TABLE order_tracking_events ADD CONSTRAINT chk_tracking_remaining CHECK (remaining_minutes IS NULL OR remaining_minutes >= 0)');

        DB::statement('CREATE INDEX idx_tracking_events_order_id ON order_tracking_events(order_id)');
        DB::statement('CREATE INDEX idx_tracking_events_event_time ON order_tracking_events(event_time DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tracking_events');
    }
};

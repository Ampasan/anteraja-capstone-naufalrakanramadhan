<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel orders: Data pengiriman/paket.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number', 32)->unique();
            $table->foreignUuid('hub_origin_id')->constrained('hubs')->restrictOnDelete();
            $table->foreignUuid('current_courier_id')->nullable()->constrained('couriers')->nullOnDelete();
            $table->string('service_type', 30);
            $table->string('category', 50);
            $table->decimal('weight_kg', 8, 2);
            $table->string('recipient_name', 100)->nullable();
            $table->string('recipient_phone', 20)->nullable();
            $table->text('destination_address');
            $table->string('destination_district', 100)->nullable();
            $table->string('destination_city', 50);
            $table->decimal('drop_latitude', 10, 7);
            $table->decimal('drop_longitude', 10, 7);
            $table->timestamp('order_time');
            $table->timestamp('pickup_time')->nullable();
            $table->timestamp('sla_deadline');
            $table->string('weather_condition', 50)->nullable();
            $table->string('traffic_condition', 50)->nullable();
            $table->decimal('temperature_c', 4, 1)->nullable();
            $table->string('delivery_status', 30)->default('ASSIGNED');
            $table->timestamps();
        });

        // Check constraints. SQLite tidak mendukung ALTER ADD CONSTRAINT,
        // jadi driver itu melewati blok ini (hanya dipakai test).
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders ADD CONSTRAINT chk_orders_service_type CHECK (service_type IN ('Instant', 'Same Day', 'Next Day', 'Regular', 'Cargo', 'Mini Cargo', 'Dokumen', 'PHARMA', 'Frozen'))");
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_weight CHECK (weight_kg > 0)');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_sla_deadline CHECK (sla_deadline >= order_time)');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_pickup_time CHECK (pickup_time IS NULL OR pickup_time >= order_time)');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_drop_lat CHECK (drop_latitude BETWEEN -90 AND 90)');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_drop_lng CHECK (drop_longitude BETWEEN -180 AND 180)');
            DB::statement("ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery_status CHECK (delivery_status IN ('PENDING_PICKUP', 'ASSIGNED', 'PICKED_UP', 'IN_SORTING_HUB', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'))");
        }

        // Index untuk optimasi query
        DB::statement('CREATE INDEX idx_orders_hub_origin_id ON orders(hub_origin_id)');
        DB::statement('CREATE INDEX idx_orders_current_courier_id ON orders(current_courier_id)');
        DB::statement('CREATE INDEX idx_orders_sla_deadline ON orders(sla_deadline ASC)');
        DB::statement('CREATE INDEX idx_orders_delivery_status ON orders(delivery_status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
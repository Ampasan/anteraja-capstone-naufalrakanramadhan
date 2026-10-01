<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel couriers: Data kurir yang melayani pengiriman.
     * 10 kurir untuk Hub Halim: 3 online, 5 idle, 2 offline.
     */
    public function up(): void
    {
        Schema::create('couriers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('courier_code', 32)->unique();
            $table->foreignUuid('hub_id')->constrained('hubs')->restrictOnDelete();
            $table->string('name', 100);
            $table->string('phone_number', 20)->unique();
            $table->string('license_plate', 20)->unique();
            $table->string('vehicle_type', 50);
            $table->string('status', 20)->default('OFFLINE');
            $table->integer('current_parcel_count')->default(0);
            $table->integer('max_parcel_count')->default(20);
            $table->decimal('current_load_kg', 8, 2)->default(0.00);
            $table->decimal('max_capacity_kg', 8, 2)->default(100.00);
            $table->text('current_address')->nullable();
            $table->boolean('is_bpom_certified')->default(false);
            $table->boolean('has_thermal_box')->default(false);
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE couriers ADD CONSTRAINT chk_couriers_status CHECK (status IN ('ONLINE', 'OFFLINE', 'IDLE', 'OFF_DUTY'))");
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_parcel_count CHECK (current_parcel_count >= 0)');
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_max_parcel CHECK (max_parcel_count > 0)');
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_load CHECK (current_load_kg >= 0)');
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_capacity CHECK (max_capacity_kg > 0)');
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_parcel_max CHECK (current_parcel_count <= max_parcel_count)');
        DB::statement('ALTER TABLE couriers ADD CONSTRAINT chk_couriers_load_max CHECK (current_load_kg <= max_capacity_kg)');
    }

    public function down(): void
    {
        Schema::dropIfExists('couriers');
    }
};

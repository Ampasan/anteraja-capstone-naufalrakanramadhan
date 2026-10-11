<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel hubs: Stasiun layanan / hub Anteraja.
     * Hub yang dipakai untuk proyek ini: ANTERAJA HUB HALIM - Jakarta Timur.
     */
    public function up(): void
    {
        Schema::create('hubs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('hub_code', 32)->unique();
            $table->string('hub_name', 100);
            $table->string('city', 50);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('service_radius_km', 4, 1)->default(5.0);
            $table->integer('max_capacity_parcels')->default(2850);
            $table->integer('current_parcels_count')->default(0);
            $table->timestamps();
        });

        // Check constraints via raw SQL. SQLite tidak mendukung ALTER ADD
        // CONSTRAINT, jadi driver itu melewati blok ini (hanya dipakai test).
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE hubs ADD CONSTRAINT chk_hubs_latitude CHECK (latitude BETWEEN -90 AND 90)');
            DB::statement('ALTER TABLE hubs ADD CONSTRAINT chk_hubs_longitude CHECK (longitude BETWEEN -180 AND 180)');
            DB::statement('ALTER TABLE hubs ADD CONSTRAINT chk_hubs_service_radius CHECK (service_radius_km > 0)');
            DB::statement('ALTER TABLE hubs ADD CONSTRAINT chk_hubs_max_capacity CHECK (max_capacity_parcels > 0)');
            DB::statement('ALTER TABLE hubs ADD CONSTRAINT chk_hubs_current_parcels CHECK (current_parcels_count >= 0 AND current_parcels_count <= max_capacity_parcels)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('hubs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel courier_telemetri: Data GPS & telemetri kurir.
     * Dipakai untuk live tracking map (dipanggil tiap 10 detik).
     */
    public function up(): void
    {
        Schema::create('courier_telemetries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('courier_id')->constrained('couriers')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('speed_kmh', 5, 2)->default(0.00);
            $table->decimal('temperature_c', 4, 1)->nullable();
            $table->integer('battery_level')->default(100);
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        // Check constraints. SQLite tidak mendukung ALTER ADD CONSTRAINT,
        // jadi driver itu melewati blok ini (hanya dipakai test).
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE courier_telemetries ADD CONSTRAINT chk_telemetries_latitude CHECK (latitude BETWEEN -90 AND 90)');
            DB::statement('ALTER TABLE courier_telemetries ADD CONSTRAINT chk_telemetries_longitude CHECK (longitude BETWEEN -180 AND 180)');
            DB::statement('ALTER TABLE courier_telemetries ADD CONSTRAINT chk_telemetries_speed CHECK (speed_kmh >= 0)');
            DB::statement('ALTER TABLE courier_telemetries ADD CONSTRAINT chk_telemetries_battery CHECK (battery_level BETWEEN 0 AND 100)');
        }

        // Index untuk query telemetri terbaru per kurir
        DB::statement('CREATE INDEX idx_telemetries_courier_time ON courier_telemetries(courier_id, recorded_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_telemetries');
    }
};

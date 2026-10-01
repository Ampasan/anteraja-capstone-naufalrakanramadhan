<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Jalankan semua seeders dalam urutan yang benar.
     */
    public function run(): void
    {
        $this->call([
            HubSeeder::class,
            UserSeeder::class,
            CourierSeeder::class,
            CourierTelemetrySeeder::class,
            OrderSeeder::class,
            IncidentSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}

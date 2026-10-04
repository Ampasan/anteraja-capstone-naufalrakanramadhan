<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
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
<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class IncidentSeeder extends Seeder
{
    /**
     * Seed 2 insiden aktif untuk Incident & Reassign.
     * Insiden 1: REPORTED (belum dikonfirmasi)
     * Insiden 2: REASSIGNING (kurir pengganti ditunjuk)
     */
    public function run(): void
    {
        $admin = User::where('email', 'siti.admin@anteraja.id')->firstOrFail();

        // Insiden 1: Anomali Suhu - REPORTED
        $order1 = Order::where('order_number', '100024000009')->firstOrFail();
        $courier1 = Courier::where('courier_code', 'HLM-008')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-083'],
            [
                'order_id' => $order1->id,
                'courier_id' => $courier1->id,
                'replacement_courier_id' => null,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Anomali Suhu',
                'title' => 'Pendingin Tidak Stabil',
                'description' => 'Suhu box pendingin motor melonjak melewati ambang aman 5.0°C (terbaca 6.2°C)',
                'location_address' => 'Jl. Gatot Subroto',
                'latitude' => -6.230100,
                'longitude' => 106.832400,
                'weather_condition' => 'Berawan',
                'traffic_condition' => 'Padat',
                'temperature_c' => 6.2,
                'evidence_image_url' => null,
                'evidence_public_id' => null,
                'status' => 'REPORTED',
                // Dilaporkan 5 menit lalu: masih dalam jendela tanggapan 10 menit
                // FRD-03 / BR-04, lalu otomatis berubah menjadi ESCALATED.
                // Re-seed sebelum demo untuk memperpanjang jendela tersebut.
                'reported_at' => now()->subMinutes(5),
                'resolved_at' => null,
            ]
        );

        // Insiden 2: Mogok Kendaraan - REASSIGNING
        $order2 = Order::where('order_number', '100024000012')->firstOrFail();
        $courier2 = Courier::where('courier_code', 'HLM-VAN-02')->firstOrFail();
        $replacement2 = Courier::where('courier_code', 'HLM-004')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-082'],
            [
                'order_id' => $order2->id,
                'courier_id' => $courier2->id,
                'replacement_courier_id' => $replacement2->id,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Mogok Kendaraan',
                'title' => 'Kopling Rusak / Mogok',
                'description' => 'Kendaraan truk mengalami kopling los di jalan panjang',
                'location_address' => 'Jl. Panjang No. 14',
                'latitude' => -6.185210,
                'longitude' => 106.771230,
                'weather_condition' => 'Cerah',
                'traffic_condition' => 'Macet Total',
                'temperature_c' => null,
                'evidence_image_url' => 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
                'evidence_public_id' => 'foto_bukti/inc-hlm-082-kopling-rusak',
                'status' => 'REASSIGNING',
                'reported_at' => now()->subHours(1),
                'resolved_at' => null,
            ]
        );
    }
}

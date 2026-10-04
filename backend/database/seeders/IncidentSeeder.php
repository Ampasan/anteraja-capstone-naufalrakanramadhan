<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\User;
use App\Services\Incident\IncidentService;
use App\Support\OperationalClock;
use Illuminate\Database\Seeder;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'siti.admin@anteraja.id')->firstOrFail();

        $this->purgeRuntimeIncidents();
        $this->seedOpenIncidents($admin);
        $this->seedUnreassignedIncident($admin);

        IncidentService::clearPanelCache($this->hubId());
    }

    private const SEED_CODES = ['INC-HLM-082', 'INC-HLM-083', 'INC-HLM-085', 'INC-HLM-086'];

    private function purgeRuntimeIncidents(): void
    {
        IncidentReport::query()
            ->where('incident_code', 'like', 'INC-HLM-%')
            ->whereNotIn('incident_code', self::SEED_CODES)
            ->delete();
    }

    private function seedOpenIncidents(User $admin): void
    {
        // ── INC-HLM-082: motor mogok — REPORTED, tanpa pengganti ─────────
        $order82 = Order::where('order_number', '100024000543')->firstOrFail();
        $courier82 = Courier::where('courier_code', 'HLM-011')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-082'],
            [
                'order_id' => $order82->id,
                'courier_id' => $courier82->id,
                'replacement_courier_id' => null,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Mogok Kendaraan',
                'title' => 'Kopling Rusak / Mogok',
                'description' => 'Motor mengalami kopling los di jalan panjang, paket terlantar di jalur',
                'location_address' => 'Jl. Bekasi Timur Raya KM 3',
                'latitude' => -6.190000,
                'longitude' => 106.921000,
                'weather_condition' => 'Cerah',
                'traffic_condition' => 'Macet Total',
                'temperature_c' => null,
                'evidence_image_url' => 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
                'evidence_public_id' => 'foto_bukti/inc-hlm-082-kopling-rusak',
                'status' => 'REPORTED',
                'reported_at' => OperationalClock::now()->subMinutes(4),
                'resolved_at' => null,
            ]
        );

        // ── INC-HLM-083: anomali suhu — ESCALATED, tanpa pengganti ───────
        $order83 = Order::where('order_number', '100024000009')->firstOrFail();
        $courier83 = Courier::where('courier_code', 'HLM-008')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-083'],
            [
                'order_id' => $order83->id,
                'courier_id' => $courier83->id,
                'replacement_courier_id' => null,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Anomali Suhu',
                'title' => 'Pendingin Tidak Stabil',
                'description' => 'Suhu box pendingin motor melonjak melewati ambang aman 5.0°C (terbaca 6.2°C)',
                'location_address' => 'Jl. Condet Raya No. 18',
                'latitude' => -6.274800,
                'longitude' => 106.887000,
                'weather_condition' => 'Berawan',
                'traffic_condition' => 'Padat',
                'temperature_c' => 6.2,
                'evidence_image_url' => null,
                'evidence_public_id' => null,
                'status' => 'ESCALATED',
                'reported_at' => OperationalClock::wib(8, 25, dayOffset: -1),
                'resolved_at' => null,
            ]
        );

        // ── INC-HLM-086: hujan deras — ESCALATED, tanpa pengganti ──────
        $order86 = Order::where('order_number', '100024000537')->firstOrFail();
        $courier86 = Courier::where('courier_code', 'HLM-002')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-086'],
            [
                'order_id' => $order86->id,
                'courier_id' => $courier86->id,
                'replacement_courier_id' => null,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Cuaca / Hujan',
                'title' => 'Cuaca / Hujan',
                'description' => 'Hujan deras mengguyur Kramat Jati tanpa henti, genangan di bahu jalan membuat kendaraan pengantar berhenti di tengah rute',
                'location_address' => 'Jl. Taman Mini Raya, Kramat Jati',
                'latitude' => -6.280000,
                'longitude' => 106.888000,
                'weather_condition' => 'Hujan Deras',
                'traffic_condition' => 'Macet',
                'temperature_c' => null,
                'evidence_image_url' => 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
                'evidence_public_id' => 'foto_bukti/inc-hlm-086-hujan-deras',
                'status' => 'ESCALATED',
                'reported_at' => OperationalClock::now()->subMinutes(18),
                'resolved_at' => null,
            ]
        );
    }

    private function seedUnreassignedIncident(User $admin): void
    {
        $order = Order::where('order_number', '100024000540')->firstOrFail();
        $reporter = Courier::where('courier_code', 'HLM-009')->firstOrFail();

        IncidentReport::updateOrCreate(
            ['incident_code' => 'INC-HLM-085'],
            [
                'order_id' => $order->id,
                'courier_id' => $reporter->id,
                'replacement_courier_id' => null,
                'handled_by_user_id' => $admin->id,
                'incident_category' => 'Banjir',
                'title' => 'Jalur Tergenang Air',
                'description' => 'Underpass Pramuka tergenang, koridor menuju tujuan tidak dapat dilalui',
                'location_address' => 'Jl. Underpass Pramuka, Matraman',
                'latitude' => -6.204000,
                'longitude' => 106.854000,
                'weather_condition' => 'Hujan Deras',
                'traffic_condition' => 'Macet',
                'temperature_c' => null,
                'evidence_image_url' => 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
                'evidence_public_id' => 'foto_bukti/inc-hlm-085-banjir-pramuka',
                'status' => 'ESCALATED',
                'reported_at' => OperationalClock::now()->subMinutes(41),
                'resolved_at' => null,
            ]
        );
    }

    private function hubId(): string
    {
        return Order::where('order_number', '100024000012')->firstOrFail()->hub_origin_id;
    }
}
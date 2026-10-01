<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    /**
     * Seed 5 data audit log untuk riwayat.
     * Audit log hanya dibuat untuk insiden yang sudah dikonfirmasi 1-klik.
     */
    public function run(): void
    {
        $admin = User::where('email', 'siti.admin@anteraja.id')->firstOrFail();

        $auditLogs = [
            [
                'log_code' => 'AUD-HLM-2026-0104',
                'order_number' => '100024000529',
                'incident_code' => 'INC-HLM-077',
                'original_courier_code' => 'HLM-002',
                'replacement_courier_code' => 'HLM-003',
                'incident_category' => 'Cuaca / Hujan',
                'incident_detail' => 'Cuaca: Hujan Lebat & Macet',
                'resolution_time_seconds' => 18.00,
                'is_sla_saved' => true,
                'notes' => 'Pengalihan sukses, SLA terselamatkan',
                'created_at' => now()->subHours(2),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0103',
                'order_number' => '100024000012',
                'incident_code' => 'INC-HLM-082',
                'original_courier_code' => 'HLM-VAN-02',
                'replacement_courier_code' => 'HLM-004',
                'incident_category' => 'Mogok Kendaraan',
                'incident_detail' => 'Kopling Rusak / Mogok',
                'resolution_time_seconds' => 22.00,
                'is_sla_saved' => true,
                'notes' => 'Pengalihan 1-klik berhasil',
                'created_at' => now()->subHours(3),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0102',
                'order_number' => '100024000009',
                'incident_code' => 'INC-HLM-083',
                'original_courier_code' => 'HLM-008',
                'replacement_courier_code' => 'STR-JKT-001',
                'incident_category' => 'Anomali Suhu',
                'incident_detail' => 'Anomali Suhu 6.2°C',
                'resolution_time_seconds' => 15.00,
                'is_sla_saved' => true,
                'notes' => 'Cold chain terselamatkan',
                'created_at' => now()->subHours(4),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0101',
                'order_number' => '100024000000',
                'incident_code' => 'INC-HLM-076',
                'original_courier_code' => 'STR-JKT-001',
                'replacement_courier_code' => 'HLM-005',
                'incident_category' => 'Ban Bocor',
                'incident_detail' => 'Ban Belakang Pecah',
                'resolution_time_seconds' => 20.00,
                'is_sla_saved' => true,
                'notes' => 'Pengalihan cepat',
                'created_at' => now()->subHours(5),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0100',
                'order_number' => '100024000008',
                'incident_code' => 'INC-HLM-075',
                'original_courier_code' => 'STR-JKT-001',
                'replacement_courier_code' => 'HLM-008',
                'incident_category' => 'Banjir',
                'incident_detail' => 'Banjir Underpass Tebet',
                'resolution_time_seconds' => 25.00,
                'is_sla_saved' => true,
                'notes' => 'Rute alternatif berhasil',
                'created_at' => now()->subHours(6),
            ],
        ];

        foreach ($auditLogs as $log) {
            $order = Order::where('order_number', $log['order_number'])->first();
            $incident = IncidentReport::where('incident_code', $log['incident_code'])->first();
            $originalCourier = Courier::where('courier_code', $log['original_courier_code'])->first();
            $replacementCourier = Courier::where('courier_code', $log['replacement_courier_code'])->first();

            if (!$order || !$originalCourier || !$replacementCourier) {
                continue;
            }

            $auditHash = hash('sha256', $log['log_code'] . $log['order_number'] . 'ONE_CLICK_REASSIGNMENT');

            AuditLog::updateOrCreate(
                ['log_code' => $log['log_code']],
                [
                    'order_id' => $order->id,
                    'incident_id' => $incident?->id,
                    'original_courier_id' => $originalCourier->id,
                    'replacement_courier_id' => $replacementCourier->id,
                    'executor_user_id' => $admin->id,
                    'incident_category' => $log['incident_category'],
                    'incident_detail' => $log['incident_detail'],
                    'action_type' => 'ONE_CLICK_REASSIGNMENT',
                    'resolution_time_seconds' => $log['resolution_time_seconds'],
                    'is_sla_saved' => $log['is_sla_saved'],
                    'audit_hash' => $auditHash,
                    'notes' => $log['notes'],
                    'created_at' => $log['created_at'],
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\User;
use App\Services\Incident\IncidentService;
use App\Support\OperationalClock;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'siti.admin@anteraja.id')->firstOrFail();
        $rows = $this->rows();
        
        AuditLog::query()
            ->where('log_code', 'like', 'AUD-HLM-%')
            ->whereNotIn('log_code', array_column($rows, 'log_code'))
            ->delete();

        foreach ($rows as $log) {
            $order = Order::where('order_number', $log['order_number'])->first();
            $incident = $log['incident_code']
                ? IncidentReport::where('incident_code', $log['incident_code'])->first()
                : null;
            $original = Courier::where('courier_code', $log['original_courier_code'])->first();
            $replacement = Courier::where('courier_code', $log['replacement_courier_code'])->first();

            if (!$order || !$original || !$replacement) {
                continue;
            }

            AuditLog::updateOrCreate(
                ['log_code' => $log['log_code']],
                [
                    'order_id' => $order->id,
                    'incident_id' => $incident?->id,
                    'original_courier_id' => $original->id,
                    'replacement_courier_id' => $replacement->id,
                    'executor_user_id' => $admin->id,
                    'incident_category' => $log['incident_category'],
                    'incident_detail' => $log['incident_detail'],
                    'resolution_time_seconds' => $log['resolution_time_seconds'],
                    'is_sla_saved' => $log['is_sla_saved'],
                    'audit_hash' => hash('sha256', $log['log_code'] . $log['order_number'] . 'ONE_CLICK_REASSIGNMENT'),
                    'created_at' => $log['created_at'],
                ]
            );

            if ($order->current_courier_id !== $replacement->id) {
                $order->update(['current_courier_id' => $replacement->id]);
            }
        }

        IncidentService::clearPanelCache($this->hubId());
    }

    private function rows(): array
    {
        return [
            [
                'log_code' => 'AUD-HLM-2026-0101',
                'order_number' => '100024000533',
                'incident_code' => null,
                'original_courier_code' => 'HLM-004',
                'replacement_courier_code' => 'HLM-008',
                'incident_category' => 'Anomali Suhu',
                'incident_detail' => 'Anomali Suhu 6.4°C',
                'resolution_time_seconds' => 12.50,
                'is_sla_saved' => true,
                'created_at' => OperationalClock::wib(9, 45, dayOffset: -1),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0102',
                'order_number' => '100024000536',
                'incident_code' => null,
                'original_courier_code' => 'HLM-003',
                'replacement_courier_code' => 'HLM-005',
                'incident_category' => 'Cuaca / Hujan',
                'incident_detail' => 'Cuaca: Hujan Lebat & Macet',
                'resolution_time_seconds' => 15.00,
                'is_sla_saved' => true,
                'created_at' => OperationalClock::wib(11, 10, dayOffset: -1),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0103',
                'order_number' => '100024000534',
                'incident_code' => null,
                'original_courier_code' => 'HLM-005',
                'replacement_courier_code' => 'HLM-010',
                'incident_category' => 'Mogok Kendaraan',
                'incident_detail' => 'Kopling Rusak / Mogok',
                'resolution_time_seconds' => 11.50,
                'is_sla_saved' => true,
                'created_at' => OperationalClock::wib(13, 35, dayOffset: -1),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0104',
                'order_number' => '100024000541',
                'incident_code' => null,
                'original_courier_code' => 'HLM-011',
                'replacement_courier_code' => 'HLM-003',
                'incident_category' => 'Mogok Kendaraan',
                'incident_detail' => 'Kopling Rusak / Mogok',
                'resolution_time_seconds' => 19.00,
                'is_sla_saved' => true,
                'created_at' => OperationalClock::wib(15, 50, dayOffset: -1),
            ],
            [
                'log_code' => 'AUD-HLM-2026-0105',
                'order_number' => '100024000543',
                'incident_code' => null,
                'original_courier_code' => 'HLM-004',
                'replacement_courier_code' => 'HLM-011',
                'incident_category' => 'Ban Bocor',
                'incident_detail' => 'Ban Belakang Pecah',
                'resolution_time_seconds' => 22.00,
                'is_sla_saved' => false,
                'created_at' => OperationalClock::now()->subMinutes(50)->addSeconds(31),
            ],
        ];
    }

    private function hubId(): string
    {
        return Order::where('order_number', '100024000540')->firstOrFail()->hub_origin_id;
    }
}
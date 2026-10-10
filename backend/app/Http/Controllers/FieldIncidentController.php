<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIncidentRequest;
use App\Models\Courier;
use App\Models\Order;
use App\Services\Incident\IncidentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Website laporan insiden lapangan (GET /lapor-insiden).
 *
 * Kurir di jalan tidak memegang akun panel, jadi empat endpoint di bawah ini
 * sengaja publik dan hanya dibatasi rate-limit per IP. Cakupannya dijaga
 * sempit: membaca daftar kurir beserta paket yang sedang dibawanya, membuat
 * satu baris insiden, dan mengunggah satu foto bukti. Seluruh kewenangan
 * panel (daftar insiden, pengalihan 1-klik, ekspor) tetap di balik login
 * Sanctum dan tidak disentuh oleh halaman ini.
 */
class FieldIncidentController extends Controller
{
    public function __construct(
        private IncidentService $incidentService
    ) {}

    /**
     * GET /api/lapor/couriers
     * Daftar kurir sebagai pilihan pelapor, dikelompokkan per hub.
     *
     * Nomor HP sengaja tidak ikut: endpoint ini terbuka tanpa login.
     */
    public function couriers(): JsonResponse
    {
        $couriers = Courier::query()
            ->join('hubs', 'hubs.id', '=', 'couriers.hub_id')
            ->orderBy('hubs.hub_name')
            ->orderBy('couriers.name')
            ->get([
                'couriers.id',
                'couriers.name',
                'couriers.courier_code',
                'couriers.vehicle_type',
                'couriers.license_plate',
                'hubs.hub_name',
            ]);

        return $this->success(['couriers' => $couriers]);
    }

    /**
     * GET /api/lapor/couriers/{courierId}/orders
     * Paket yang sedang dibawa kurir, untuk mengisi nomor resi tanpa mengetik.
     */
    public function orders(string $courierId): JsonResponse
    {
        // Pemeriksaan UUID di depan: kolom id bertipe uuid di PostgreSQL
        // melempar kesalahan kueri, bukan 404, untuk nilai acak.
        if (! Str::isUuid($courierId)) {
            return $this->error('Kurir tidak ditemukan.', 404);
        }

        $courier = Courier::find($courierId);

        if ($courier === null) {
            return $this->error('Kurir tidak ditemukan.', 404);
        }

        $orders = Order::query()
            ->where('current_courier_id', $courier->id)
            ->where('delivery_status', '!=', 'DELIVERED')
            ->orderBy('sla_deadline')
            ->limit(30)
            ->get([
                'order_number',
                'service_type',
                'destination_city',
                'delivery_status',
                'sla_deadline',
            ]);

        return $this->success(['orders' => $orders]);
    }

    /**
     * POST /api/lapor/incidents
     * Simpan laporan insiden lapangan tanpa akun panel.
     */
    public function store(StoreIncidentRequest $request): JsonResponse
    {
        try {
            $incident = $this->incidentService->createIncident($request->validated());

            return $this->success($incident, 'Laporan insiden berhasil dikirim', 201);
        } catch (ModelNotFoundException) {
            return $this->error('Nomor resi atau kurir tidak ditemukan.', 404);
        } catch (\Exception $e) {
            report($e);

            return $this->error('Laporan gagal disimpan. Coba lagi.', 500);
        }
    }

    /**
     * POST /api/lapor/incidents/{id}/evidence
     * Unggah foto bukti milik laporan yang baru saja dibuat.
     */
    public function evidence(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120', // Max 5MB
            'caption' => 'nullable|string|max:255',
        ]);

        try {
            $evidence = $this->incidentService->attachEvidence(
                $id,
                $request->file('photo'),
                $request->input('caption')
            );

            return $this->success(['evidence' => $evidence], 'Foto bukti berhasil diunggah', 201);
        } catch (ModelNotFoundException) {
            return $this->error('Insiden tidak ditemukan.', 404);
        } catch (\Exception $e) {
            report($e);

            return $this->error('Foto gagal diunggah. Coba lagi.', 500);
        }
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_number' => 'required|string|exists:orders,order_number',
            'courier_id' => 'required|uuid|exists:couriers,id',
            'incident_category' => 'required|string|in:Cuaca / Hujan,Anomali Suhu,Mogok Kendaraan,Ban Bocor,Alamat tidak ditemukan,Banjir,Macet Total',
            'title' => 'required|string|max:150',
            'description' => 'nullable|string',
            'location_address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'weather_condition' => 'nullable|string',
            'traffic_condition' => 'nullable|string',
            'temperature_c' => 'nullable|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'order_number.required' => 'Nomor resi wajib diisi.',
            'order_number.exists' => 'Resi tidak ditemukan.',
            'courier_id.required' => 'Kurir wajib dipilih.',
            'incident_category.required' => 'Kategori insiden wajib diisi.',
            'title.required' => 'Judul insiden wajib diisi.',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReassignIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'replacement_courier_id' => 'required|uuid|exists:couriers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'replacement_courier_id.required' => 'Kurir pengganti wajib dipilih.',
            'replacement_courier_id.exists' => 'Kurir pengganti tidak ditemukan.',
        ];
    }
}

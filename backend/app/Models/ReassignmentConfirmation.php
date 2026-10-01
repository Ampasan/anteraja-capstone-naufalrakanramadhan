<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReassignmentConfirmation extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'confirmation_code',
        'incident_id',
        'order_id',
        'original_courier_id',
        'replacement_courier_id',
        'confirmed_by_user_id',
        'confirmation_method',
        'confirmation_time',
        'estimated_resolution_seconds',
        'actual_resolution_seconds',
        'is_sla_saved',
        'status',
        'notes',
    ];

    protected $casts = [
        'confirmation_time' => 'datetime',
        'estimated_resolution_seconds' => 'integer',
        'actual_resolution_seconds' => 'integer',
        'is_sla_saved' => 'boolean',
    ];

    public function incident(): BelongsTo
    {
        // Kolomnya `incident_id`, bukan `incident_report_id` (nama bawaan).
        return $this->belongsTo(IncidentReport::class, 'incident_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function originalCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'original_courier_id');
    }

    public function replacementCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'replacement_courier_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }
}

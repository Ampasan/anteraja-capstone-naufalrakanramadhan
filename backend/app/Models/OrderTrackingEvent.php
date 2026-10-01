<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderTrackingEvent extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'order_id',
        'event_type',
        'event_time',
        'location_description',
        'manifest_number',
        'sortation_gate',
        'speed_kmh',
        'traffic_condition',
        'weather_condition',
        'remaining_distance_km',
        'estimated_arrival_time',
        'remaining_minutes',
        'notes',
    ];

    protected $casts = [
        'event_time' => 'datetime',
        'speed_kmh' => 'decimal:2',
        'remaining_distance_km' => 'decimal:2',
        'estimated_arrival_time' => 'datetime',
        'remaining_minutes' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

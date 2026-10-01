<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'order_number',
        'hub_origin_id',
        'current_courier_id',
        'service_type',
        'category',
        'weight_kg',
        'dimension_length_cm',
        'dimension_width_cm',
        'dimension_height_cm',
        'special_handling',
        'recipient_name',
        'recipient_phone',
        'destination_address',
        'destination_district',
        'destination_city',
        'drop_latitude',
        'drop_longitude',
        'order_time',
        'pickup_time',
        'delivery_time_minutes',
        'sla_deadline',
        'weather_condition',
        'traffic_condition',
        'temperature_c',
        'manifest_number',
        'estimated_arrival_time',
        'remaining_distance_km',
        'sla_risk_score',
        'delivery_status',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:2',
        'dimension_length_cm' => 'integer',
        'dimension_width_cm' => 'integer',
        'dimension_height_cm' => 'integer',
        'drop_latitude' => 'decimal:7',
        'drop_longitude' => 'decimal:7',
        'order_time' => 'datetime',
        'pickup_time' => 'datetime',
        'delivery_time_minutes' => 'integer',
        'sla_deadline' => 'datetime',
        'temperature_c' => 'decimal:1',
        'estimated_arrival_time' => 'datetime',
        'remaining_distance_km' => 'decimal:2',
        'sla_risk_score' => 'decimal:1',
    ];

    public function hubOrigin(): BelongsTo
    {
        return $this->belongsTo(Hub::class, 'hub_origin_id');
    }

    public function currentCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'current_courier_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(OrderAssignment::class);
    }

    public function incidentReports(): HasMany
    {
        return $this->hasMany(IncidentReport::class);
    }

    public function trackingEvents(): HasMany
    {
        return $this->hasMany(OrderTrackingEvent::class);
    }

    public function delayPredictions(): HasMany
    {
        return $this->hasMany(DelayPrediction::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function reassignmentConfirmations(): HasMany
    {
        return $this->hasMany(ReassignmentConfirmation::class);
    }

    /**
     * Scope: Order yang masih aktif (belum delivered/returned).
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('delivery_status', ['DELIVERED', 'RETURNED']);
    }

    /**
     * Scope: Order dengan SLA deadline dalam X menit ke depan.
     */
    public function scopeSlaCritical($query, int $minutes = 30)
    {
        return $query->where('sla_deadline', '<', now()->addMinutes($minutes));
    }
}

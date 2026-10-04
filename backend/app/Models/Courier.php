<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Courier extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'courier_code',
        'hub_id',
        'name',
        'phone_number',
        'license_plate',
        'vehicle_type',
        'status',
        'current_parcel_count',
        'max_parcel_count',
        'current_load_kg',
        'max_capacity_kg',
        'current_address',
        'is_bpom_certified',
        'has_thermal_box',
    ];

    protected $casts = [
        'current_parcel_count' => 'integer',
        'max_parcel_count' => 'integer',
        'current_load_kg' => 'decimal:2',
        'max_capacity_kg' => 'decimal:2',
        'is_bpom_certified' => 'boolean',
        'has_thermal_box' => 'boolean',
    ];

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function telemetries(): HasMany
    {
        return $this->hasMany(CourierTelemetry::class);
    }

    public function latestTelemetry(): HasOne
    {
        return $this->hasOne(CourierTelemetry::class)->latest('recorded_at');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'current_courier_id');
    }

    public function incidentReports(): HasMany
    {
        return $this->hasMany(IncidentReport::class);
    }

    public function auditLogsAsOriginal(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'original_courier_id');
    }

    public function auditLogsAsReplacement(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'replacement_courier_id');
    }
}

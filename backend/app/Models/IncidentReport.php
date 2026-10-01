<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncidentReport extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'incident_code',
        'order_id',
        'courier_id',
        'replacement_courier_id',
        'handled_by_user_id',
        'incident_category',
        'title',
        'description',
        'location_address',
        'latitude',
        'longitude',
        'weather_condition',
        'traffic_condition',
        'temperature_c',
        'evidence_image_url',
        'evidence_public_id',
        'status',
        'reported_at',
        'resolved_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'temperature_c' => 'decimal:1',
        'reported_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function courier(): BelongsTo
    {
        return $this->belongsTo(Courier::class);
    }

    public function replacementCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'replacement_courier_id');
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by_user_id');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(IncidentEvidence::class, 'incident_id');
    }

    public function assignments(): HasMany
    {
        // Foreign key eksplisit: kolomnya `incident_id`, bukan nama bawaan
        // `incident_report_id` yang tidak ada di tabel order_assignments.
        return $this->hasMany(OrderAssignment::class, 'incident_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'incident_id');
    }

    public function reassignmentConfirmations(): HasMany
    {
        return $this->hasMany(ReassignmentConfirmation::class, 'incident_id');
    }
}

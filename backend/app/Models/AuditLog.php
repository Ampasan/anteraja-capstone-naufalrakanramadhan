<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    // Audit log immutable - tidak bisa diupdate
    protected $fillable = [
        'log_code',
        'order_id',
        'incident_id',
        'original_courier_id',
        'replacement_courier_id',
        'executor_user_id',
        'incident_category',
        'incident_detail',
        'action_type',
        'resolution_time_seconds',
        'is_sla_saved',
        'audit_hash',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'resolution_time_seconds' => 'decimal:2',
        'is_sla_saved' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function incident(): BelongsTo
    {
        // Kolomnya `incident_id`, bukan `incident_report_id` (nama bawaan).
        return $this->belongsTo(IncidentReport::class, 'incident_id');
    }

    public function originalCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'original_courier_id');
    }

    public function replacementCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'replacement_courier_id');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_user_id');
    }
}

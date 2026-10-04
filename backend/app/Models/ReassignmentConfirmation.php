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
        'confirmation_time',
        'status',
    ];

    protected $casts = [
        'confirmation_time' => 'datetime',
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
}

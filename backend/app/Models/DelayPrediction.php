<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DelayPrediction extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'order_id',
        'weather_condition',
        'traffic_condition',
        'sla_risk_level',
        'sla_risk_score',
        'predicted_delay_minutes',
        'analysis_summary',
    ];

    protected $casts = [
        'sla_risk_score' => 'decimal:1',
        'predicted_delay_minutes' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

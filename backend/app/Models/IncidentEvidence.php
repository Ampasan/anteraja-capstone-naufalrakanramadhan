<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentEvidence extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'incident_evidences';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'incident_id',
        'cloudinary_public_id',
        'secure_url',
        'caption',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function incident(): BelongsTo
    {
        // Kolomnya `incident_id`, bukan `incident_report_id` (nama bawaan).
        return $this->belongsTo(IncidentReport::class, 'incident_id');
    }
}

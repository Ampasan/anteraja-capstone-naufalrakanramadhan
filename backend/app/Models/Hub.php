<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Hub extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hub_code',
        'hub_name',
        'city',
        'address',
        'latitude',
        'longitude',
        'service_radius_km',
        'max_capacity_parcels',
        'current_parcels_count',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'service_radius_km' => 'decimal:1',
        'max_capacity_parcels' => 'integer',
        'current_parcels_count' => 'integer',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function couriers(): HasMany
    {
        return $this->hasMany(Courier::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'hub_origin_id');
    }

    /**
     * Ambil data hub dari cache (5 menit).
     * Data hub nyaris tidak berubah, jadi tidak perlu query tiap request —
     * menghemat 1 round-trip (~180ms) di endpoint yang butuh koordinat hub
     * (couriers, sla-risk).
     */
    public static function cached(string $hubId): ?self
    {
        return Cache::remember("hub_{$hubId}", 300, fn () => static::find($hubId));
    }
}

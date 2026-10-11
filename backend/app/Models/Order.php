<?php

namespace App\Models;

use App\Support\OperationalClock;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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
        'recipient_name',
        'recipient_phone',
        'destination_address',
        'destination_district',
        'destination_city',
        'drop_latitude',
        'drop_longitude',
        'order_time',
        'pickup_time',
        'sla_deadline',
        'weather_condition',
        'traffic_condition',
        'temperature_c',
        'delivery_status',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:2',
        'drop_latitude' => 'decimal:7',
        'drop_longitude' => 'decimal:7',
        'order_time' => 'datetime',
        'pickup_time' => 'datetime',
        'sla_deadline' => 'datetime',
        'temperature_c' => 'decimal:1',
    ];

    public function hubOrigin(): BelongsTo
    {
        return $this->belongsTo(Hub::class, 'hub_origin_id');
    }

    public function currentCourier(): BelongsTo
    {
        return $this->belongsTo(Courier::class, 'current_courier_id');
    }

    public function incidentReports(): HasMany
    {
        return $this->hasMany(IncidentReport::class);
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
     * Ambang skor minimum untuk tiap level risiko.
     *
     * Didefinisikan sekali di sini dan dipakai oleh ekspresi SQL, filter
     * tabel, maupun fallback PHP — supaya ketiganya tidak pernah berbeda
     * (sebelumnya SQL memakai 4/2 sedangkan PHP memakai bobot lain sehingga
     * panel dan tabel sering tidak sepakat).
     */
    public const RISK_KRITIS_MIN = 6;

    public const RISK_WASPADA_MIN = 3;

    /** Skor risiko dikunci pada 0-10, sama dengan rentang ekspresi skor. */
    public const RISK_SCORE_MAX = 10;

    /**
     * Ekspresi SQL untuk sisa menit SLA, diturunkan dari tenggat waktu.
     *
     * Sisa menit tidak disimpan sebagai kolom terpisah — sumber kebenaran
     * tunggal adalah sla_deadline, dan selisihnya dihitung di SQL supaya
     * hasilnya sama untuk semua pemanggil.
     *
     * Perbedaan fungsi tanggal antar driver (NOW() diganti jam operasional
     * supaya hasilnya jatuh di dalam rentang 08.00-20.00 WIB):
     *
     *   PostgreSQL : EXTRACT(EPOCH FROM (sla_deadline - '{now}'::timestamp)) / 60
     *   MySQL      : TIMESTAMPDIFF(MINUTE, '{now}', sla_deadline)
     *   SQLite     : (julianday(sla_deadline) - julianday('{now}')) * 1440
     *
     * Asumsi: jam database sama dengan jam aplikasi (UTC), sebagaimana
     * dikonfigurasikan di config/app.php.
     */
    public static function remainingMinutesExpression(): string
    {
        $now = OperationalClock::sqlLiteral();

        return match (DB::connection()->getDriverName()) {
            'pgsql' => "EXTRACT(EPOCH FROM (sla_deadline - '{$now}'::timestamp)) / 60",
            'mysql' => "TIMESTAMPDIFF(MINUTE, '{$now}', sla_deadline)",
            default => "(julianday(sla_deadline) - julianday('{$now}')) * 1440",
        };
    }

    /**
     * Ekspresi SQL: kondisi lalu lintas padat/macet.
     *
     * Dipakai pencocokan sebagian (LIKE) supaya varian tulisan seperti
     * "Cawang Padat", "Macet Total", atau "macet" ikut terhitung. Versi
     * PHP-nya ada di SlaRiskService::isCongestedTraffic dan harus selaras.
     */
    public static function congestedTrafficExpression(): string
    {
        $traffic = "LOWER(COALESCE(traffic_condition, ''))";

        return "({$traffic} LIKE '%macet%' OR {$traffic} LIKE '%padat%')";
    }

    /**
     * Ekspresi SQL untuk pembatas skor (LEAST/MIN antar driver).
     */
    private static function capExpression(string $score): string
    {
        $max = self::RISK_SCORE_MAX;

        return match (DB::connection()->getDriverName()) {
            'sqlite' => "MIN({$max}, {$score})",
            default => "LEAST({$max}, {$score})",
        };
    }

    /**
     * Ekspresi SQL untuk skor risiko numerik (0-10, untuk diurutkan).
     *
     * Pita waktu (sisa menit SLA) menentukan skor dasar:
     *   lewat tenggat  → 10  (telah melanggar SLA)
     *   <= 15 menit    →  7  (hampir pasti telat)
     *   <= 60 menit    →  4  (berisiko, perlu dipantau)
     *   <= 180 menit   →  2  (wajar)
     *   lebih          →  1  (aman)
     *
     * Ditambah penambah risiko: pelanggaran cold-chain (+2) dan lalu lintas
     * padat (+1), lalu dibatasi 10 supaya tetap berada di rentang 0-10.
     *
     * Rumus ini adalah satu-satunya sumber kebenaran; SlaRiskService memakai
     * terjemahan PHP-nya agar hasil fallback identik dengan hasil SQL.
     */
    public static function riskScoreExpression(): string
    {
        $remaining = self::remainingMinutesExpression();
        $congested = self::congestedTrafficExpression();

        $score = "
            CASE
                WHEN ({$remaining}) < 0 THEN 10
                WHEN ({$remaining}) <= 15 THEN 7
                WHEN ({$remaining}) <= 60 THEN 4
                WHEN ({$remaining}) <= 180 THEN 2
                ELSE 1
            END
            + CASE WHEN service_type = 'Frozen' AND temperature_c > 5.0 THEN 2 ELSE 0 END
            + CASE WHEN {$congested} THEN 1 ELSE 0 END
        ";

        return self::capExpression($score);
    }

    /**
     * Ekspresi SQL untuk label level risiko, diturunkan dari skor.
     */
    public static function riskLevelExpression(): string
    {
        $score = self::riskScoreExpression();

        return "CASE
            WHEN ({$score}) >= " . self::RISK_KRITIS_MIN . " THEN 'Kritis'
            WHEN ({$score}) >= " . self::RISK_WASPADA_MIN . " THEN 'Waspada'
            ELSE 'Aman'
        END";
    }

    /**
     * Ekspresi SQL untuk peringkat prioritas: Kritis 0, Waspada 1, Aman 2.
     *
     * Dipakai di ORDER BY tabel tugas. Dua jalan pintas sengaja tidak dipakai:
     * mengurutkan label `risk_level` hanya menghasilkan urutan alfabet
     * ("Aman" < "Kritis" < "Waspada") yang prioritasnya terbalik, dan memakai
     * alias `risk_score` di dalam CASE tidak sah di PostgreSQL — alias SELECT
     * hanya boleh berdiri sendiri sebagai kunci ORDER BY. Karena itu rumus
     * skornya dimasukkan ulang lewat parameter.
     *
     * @param  string  $score  ekspresi skor, mis. Order::riskScoreExpression()
     */
    public static function riskRankExpression(string $score): string
    {
        return "CASE
            WHEN ({$score}) < " . self::RISK_WASPADA_MIN . " THEN 2
            WHEN ({$score}) < " . self::RISK_KRITIS_MIN . " THEN 1
            ELSE 0
        END";
    }

    /**
     * Level risiko dari skor yang sudah dihitung (untuk jalur PHP).
     */
    public static function riskLevelFromScore(int|float $score): string
    {
        if ($score >= self::RISK_KRITIS_MIN) {
            return 'Kritis';
        }

        if ($score >= self::RISK_WASPADA_MIN) {
            return 'Waspada';
        }

        return 'Aman';
    }

    /**
     * Scope: tambahkan kolom remaining_minutes, risk_score, dan risk_level
     * yang dihitung di SQL.
     *
     * Skor dan urutan prioritas dihitung di SQL (bukan sortByDesc di PHP),
     * sehingga hasilnya bisa dipaginasi tanpa memuat seluruh tabel.
     */
    public function scopeWithRiskScore($query)
    {
        $remaining = self::remainingMinutesExpression();
        $score = self::riskScoreExpression();

        return $query
            ->addSelect(DB::raw("({$remaining}) AS remaining_minutes"))
            ->addSelect(DB::raw("({$score}) AS risk_score"))
            ->addSelect(DB::raw('(' . self::riskLevelExpression() . ') AS risk_level'));
    }
}

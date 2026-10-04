<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * Access token dengan pencarian token & pemiliknya dalam SATU round-trip.
 *
 * Guard bawaan Sanctum mengambil token dalam query pertama, lalu menyelesaikan
 * relasi `tokenable` (tabel `users`) pada query kedua. Karena database aplikasi
 * berada di Supabase (remote), tiap round-trip memakan ±170 ms — berarti hampir
 * setiap endpoint membayar ±170 ms hanya untuk autentikasi, terlepas dari
 * isi endpointnya.
 *
 * Di PostgreSQL, kedua baris itu bisa diambil sekaligus dengan LEFT JOIN dan
 * memaketkan kolom pemilik sebagai JSON (`to_jsonb(users.*)`), sehingga model
 * User bisa dibangun tanpa perlu tahu daftar kolomnya — tidak ada query skema,
 * dan penambahan kolom pada tabel `users` otomatis ikut terbawa.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * Alias kolom bantuan hasil JOIN; dibuang dari atribut sebelum disimpan.
     */
    private const TOKENABLE_ALIAS = '__tokenable';

    /**
     * Cari token sesuai nilai yang dikirim klien (Laravel\Sanctum\Contracts\HasAbilities).
     *
     * Semantiknya identik dengan implementasi bawaan: tanpa tanda `|` token
     * dicocokkan lewat hash SHA-256; dengan tanda `|` bagian sebelumnya adalah
     * primary key dan sisanya adalah token polos yang diverifikasi `hash_equals`.
     *
     * @param  string  $token
     * @return static|null
     */
    public static function findToken($token)
    {
        $connection = (new static)->getConnection();

        // Driver selain PostgreSQL (mis. sqlite `:memory:` pada pengujian) tidak
        // punya to_jsonb; jalur cadangan memakai perilaku bawaan Sanctum.
        if ($connection->getDriverName() !== 'pgsql') {
            return parent::findToken($token);
        }

        $hasKey = strpos($token, '|') !== false;

        if ($hasKey) {
            [$id, $plain] = explode('|', $token, 2);
        } else {
            [$id, $plain] = [null, $token];
        }

        $row = DB::table('personal_access_tokens')
            ->leftJoin('users', function ($join) {
                $join->on('users.id', '=', 'personal_access_tokens.tokenable_id')
                    ->where('personal_access_tokens.tokenable_type', '=', User::class);
            })
            ->when(
                $hasKey,
                fn ($query) => $query->where('personal_access_tokens.id', $id),
                fn ($query) => $query->where('personal_access_tokens.token', hash('sha256', $plain)),
            )
            ->select('personal_access_tokens.*')
            ->selectRaw('CASE WHEN users.id IS NULL THEN NULL ELSE to_jsonb(users.*) END AS ' . self::TOKENABLE_ALIAS)
            ->first();

        if ($row === null) {
            return null;
        }

        $attributes = (array) $row;
        $tokenableJson = $attributes[self::TOKENABLE_ALIAS] ?? null;
        unset($attributes[self::TOKENABLE_ALIAS]);

        if (! hash_equals($attributes['token'], hash('sha256', $plain))) {
            return null;
        }

        $accessToken = (new static)->newFromBuilder($attributes, $connection->getName());

        if (is_string($tokenableJson) && $tokenableJson !== '') {
            $decoded = json_decode($tokenableJson, true);

            if (is_array($decoded) && $decoded !== []) {
                // Relasi sudah terisi, jadi Guard tidak perlu query lanjutan.
                $accessToken->setRelation('tokenable', (new User)->newFromBuilder($decoded, $connection->getName()));
            }
        }

        return $accessToken;
    }
}

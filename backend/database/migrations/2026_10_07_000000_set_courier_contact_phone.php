<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Satu nomor kontak untuk seluruh kurir: 087723305893.
 *
 * `couriers.phone_number` semula UNIQUE, jadi kolom itu mustahil menyimpan
 * nomor yang sama untuk semua kurir. Unique index-nya dilepas lebih dulu,
 * baru seluruh baris diperbarui. Down() hanya memasang kembali unique index
 * bila nilainya sudah unik lagi — kalau tidak, migrasi dibiarkan lewat
 * daripada gagal di tengah.
 */
return new class extends Migration
{
    /** Nomor yang dipakai untuk menghubungi kurir. */
    private const CONTACT_PHONE = '087723305893';

    public function up(): void
    {
        if (! Schema::hasTable('couriers')) {
            return;
        }

        $this->dropPhoneUniqueIndex();

        DB::table('couriers')->update(['phone_number' => self::CONTACT_PHONE]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('couriers')) {
            return;
        }

        $hasDuplicate = DB::table('couriers')
            ->select('phone_number')
            ->groupBy('phone_number')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicate) {
            return;
        }

        Schema::table('couriers', function (Blueprint $table) {
            $table->unique('phone_number', 'couriers_phone_number_unique');
        });
    }

    /** lepas unique index phone_number lintas driver (pgsql & sqlite). */
    private function dropPhoneUniqueIndex(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // UNIQUE di Postgres melekat sebagai constraint tabel, bukan index
            // biasa: `DROP INDEX` akan ditolak dengan "constraint ... requires it".
            // Jadi cari constraint unique-nya di katalog, lalu DROP CONSTRAINT.
            $constraints = DB::select(
                "SELECT c.conname
                   FROM pg_constraint c
                   JOIN pg_class t ON t.oid = c.conrelid
                   JOIN pg_namespace n ON n.oid = t.relnamespace
                   JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
                  WHERE n.nspname = 'public'
                    AND t.relname = 'couriers'
                    AND c.contype = 'u'
                    AND a.attname = 'phone_number'"
            );

            foreach ($constraints as $constraint) {
                $name = str_replace('"', '""', $constraint->conname);
                DB::statement("ALTER TABLE couriers DROP CONSTRAINT IF EXISTS \"{$name}\"");
            }

            // Sisa kandidat berupa unique index biasa (bila dibuat lewat SQL mentah).
            $indexes = DB::select(
                "SELECT indexname FROM pg_indexes
                 WHERE schemaname = 'public'
                   AND tablename = 'couriers'
                   AND indexdef ILIKE '%UNIQUE%phone_number%'"
            );

            foreach ($indexes as $index) {
                $name = str_replace('"', '""', $index->indexname);
                DB::statement("DROP INDEX IF EXISTS \"{$name}\"");
            }

            return;
        }

        Schema::table('couriers', function (Blueprint $table) {
            $table->dropUnique(['phone_number']);
        });
    }
};

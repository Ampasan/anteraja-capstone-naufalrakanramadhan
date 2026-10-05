<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Aktifkan Row Level Security (RLS) di seluruh tabel aplikasi pada schema `public`.
 *
 * Konteks: database Supabase membuka PostgREST pada URL yang sama dengan kunci
 * `anon`/`authenticated` yang biasa ditanam di frontend. Sebelum migration ini,
 * ke-12 tabel aplikasi memberi GRANT ALL (SELECT/INSERT/UPDATE/DELETE) kepada
 * kedua role tersebut, dan 10 di antaranya belum punya RLS — artinya siapa pun
 * yang menyimpan kunci `anon` bisa membaca `users` dan `personal_access_tokens`
 * lewat `/rest/v1/` tanpa aplikasi ini terlibat sama sekali.
 *
 * RLS bersifat deny-by-default: tanpa policy, role `anon` dan `authenticated`
 * tidak melihat baris mana pun dan INSERT-nya ditolak database. Kedua role itu
 * memang tidak dipakai — frontend murni lewat API Laravel (lihat `src/lib/api.ts`),
 * tidak ada supabase-js di seluruh repo.
 *
 * Yang TIDAK terpengaruh, dan memang sengaja begitu:
 *
 *   - Koneksi Laravel memakai role `postgres` yang pemilik tabel sekaligus
 *     pemegang BYPASSRLS, jadi RLS tidak pernah menahannya. Migrasi, seeder,
 *     dan seluruh query aplikasi tetap berjalan penuh.
 *   - `service_role` juga BYPASSRLS (dipakai Supabase dari server saja).
 *   - Tabel milik Supabase (`auth`, `storage`, `realtime`, `vault`) tidak
 *     disentuh; sudah dikelola Supabase sendiri.
 *
 * RLS sengaja TIDAK di-FORCE: FORCE hanya berlaku untuk pemilik tabel tanpa
 * BYPASSRLS, dan di database ini tidak ada role seperti itu — efeknya nol,
 * hanya membingungkan pembaca berikutnya.
 *
 * Catatan: RLS ini menutup lubang API anon, tetapi TIDAK membatasi koneksi
 * aplikasi itu sendiri. Pembatasan serius butuh role database tersendiri untuk
 * aplikasi (bukan `postgres`), di luar cakupan migration ini.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // Suite tes memakai sqlite :memory:; RLS adalah fitur PostgreSQL.
            return;
        }

        $tables = DB::select(
            <<<'SQL'
            SELECT c.relname AS table_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind IN ('r', 'p')
              AND NOT c.relrowsecurity
            ORDER BY c.relname
            SQL
        );

        foreach ($tables as $row) {
            $name = $row->table_name;
            if (! preg_match('/^[a-z_][a-z0-9_]*$/', $name)) {
                // Nama aneh dari katalog: jangan dieksekusi sebagai SQL mentah.
                continue;
            }

            DB::statement(sprintf('ALTER TABLE public."%s" ENABLE ROW LEVEL SECURITY', $name));
        }
    }

    public function down(): void
    {
        // Sengaja kosong. Melepas RLS mengembalikan celah baca/tulis penuh untuk
        // role `anon` lewat PostgREST, dan celah itu tidak layak dikembalikan
        // hanya untuk memutar balik migration. Kalau benar-benar perlu, jalankan
        // manual: ALTER TABLE public.<tabel> DISABLE ROW LEVEL SECURITY;
    }
};

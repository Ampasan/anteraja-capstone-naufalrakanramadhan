<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Index yang belum dimiliki PostgreSQL.
     *
     * PostgreSQL tidak mengindex kolom foreign key secara otomatis (beda dengan
     * MySQL), padahal tiap round-trip ke Supabase memakan ±170 ms. Semua index di
     * bawah dipakai oleh query yang sudah ada: sub-query penghitung di
     * /dashboard/summary, JOIN insiden di /incidents, dan pemeriksaan pengalihan
     * ganda yang berjalan di dalam transaksi ber-lock.
     */
    public function up(): void
    {
        // Sub-query `count(*) from couriers where hub_id = ?` (dashboard summary)
        // dan segala pencarian kurir tanpa syarat status. Index parsial
        // (hub_id, status) hanya mencakup ONLINE/IDLE sehingga tidak berlaku di sini.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_couriers_hub_id
            ON couriers(hub_id)');

        // JOIN incident_reports -> couriers di getIncidents() dan penghitung
        // "insiden terbuka" di dashboard summary keduanya menyelewangi kolom ini.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_incidents_courier_id
            ON incident_reports(courier_id)');

        // Pencarian insiden berdasarkan kurir pengganti setelah pengalihan.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_incidents_replacement_courier_id
            ON incident_reports(replacement_courier_id)');

        // Riwayat audit dibaca lewat relasi insiden, dan tabelnya terus bertambah
        // tanpa batas tanpa index ini.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_audit_logs_incident_id
            ON audit_logs(incident_id)');

        // Pemeriksaan "pengalihan ganda dalam 1 menit" dijalankan di dalam
        // transaksi lockForUpdate — index ini memangkas waktu kunci dipegang.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_reassignment_confirmations_time
            ON reassignment_confirmations(confirmation_time)');

        // NOT EXISTS per baris pada tabel tugas: mengganti index satu kolom
        // dengan komposit supaya pemeriksaan "kiriman lain kurir ini lebih
        // mendesak" tidak membaca dua kali.
        DB::statement('CREATE INDEX IF NOT EXISTS idx_orders_courier_status_deadline
            ON orders(current_courier_id, delivery_status, sla_deadline)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_couriers_hub_id');
        DB::statement('DROP INDEX IF EXISTS idx_incidents_courier_id');
        DB::statement('DROP INDEX IF EXISTS idx_incidents_replacement_courier_id');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_incident_id');
        DB::statement('DROP INDEX IF EXISTS idx_reassignment_confirmations_time');
        DB::statement('DROP INDEX IF EXISTS idx_orders_courier_status_deadline');
    }
};

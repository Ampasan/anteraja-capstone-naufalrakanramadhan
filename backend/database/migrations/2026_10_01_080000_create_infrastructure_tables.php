<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel infrastruktur Laravel yang benar-benar dipakai proyek ini:
     * - failed_jobs -> pencatatan job yang gagal (QUEUE_FAILED_DRIVER=database-uuids,
     *   dicek juga oleh GET /api/health).
     *
     * Tabel sessions, cache, cache_locks, jobs, dan job_batches sengaja tidak
     * dibuat: .env memakai SESSION_DRIVER=redis, CACHE_STORE=redis, dan
     * QUEUE_CONNECTION=redis, jadi kelima tabel itu selalu kosong.
     */
    public function up(): void
    {
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('failed_jobs');
    }
};

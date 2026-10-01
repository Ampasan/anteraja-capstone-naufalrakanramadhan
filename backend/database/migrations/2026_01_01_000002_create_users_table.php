<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel users: Admin hub yang bisa login ke mini panel.
     * 3 user admin untuk Hub Halim - Jakarta Timur.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('hub_id')->constrained('hubs')->restrictOnDelete();
            $table->string('name', 100);
            $table->string('email', 150)->unique();
            $table->string('password_hash', 255);
            $table->string('role', 30)->default('ADMIN');
            $table->string('status', 20)->default('ACTIVE');
            $table->integer('failed_login_attempts')->default(0);
            $table->timestamp('lockout_until')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('ADMIN'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'SUSPENDED'))");
        DB::statement('ALTER TABLE users ADD CONSTRAINT chk_users_failed_attempts CHECK (failed_login_attempts >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

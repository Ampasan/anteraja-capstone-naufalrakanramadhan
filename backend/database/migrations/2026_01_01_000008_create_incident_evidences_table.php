<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel incident_evidences: Foto bukti insiden dari Cloudinary.
     */
    public function up(): void
    {
        Schema::create('incident_evidences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('incident_id')->constrained('incident_reports')->cascadeOnDelete();
            $table->string('cloudinary_public_id', 255);
            $table->text('secure_url');
            $table->string('folder', 100)->default('foto_bukti');
            $table->string('file_format', 20)->nullable();
            $table->integer('file_size_bytes')->nullable();
            $table->text('caption')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
        });

        // Check constraints
        DB::statement('ALTER TABLE incident_evidences ADD CONSTRAINT chk_evidences_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)');

        DB::statement('CREATE INDEX idx_incident_evidences_incident_id ON incident_evidences(incident_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_evidences');
    }
};

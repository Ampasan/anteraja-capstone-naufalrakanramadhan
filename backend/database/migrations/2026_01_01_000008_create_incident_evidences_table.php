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
            $table->text('caption')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
        });

        // Check constraints
        DB::statement('CREATE INDEX idx_incident_evidences_incident_id ON incident_evidences(incident_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_evidences');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel delay_predictions: Prediksi keterlambatan berbasis AI.
     */
    public function up(): void
    {
        Schema::create('delay_predictions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('weather_condition', 50)->nullable();
            $table->string('traffic_condition', 50)->nullable();
            $table->string('sla_risk_level', 20);
            $table->decimal('sla_risk_score', 3, 1);
            $table->integer('predicted_delay_minutes')->default(0);
            $table->text('analysis_summary')->nullable();
            $table->timestamps();
        });

        // Check constraints
        DB::statement("ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_risk_level CHECK (sla_risk_level IN ('Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah'))");
        DB::statement('ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_risk_score CHECK (sla_risk_score >= 0 AND sla_risk_score <= 10)');
        DB::statement('ALTER TABLE delay_predictions ADD CONSTRAINT chk_delay_predicted CHECK (predicted_delay_minutes >= 0)');

        DB::statement('CREATE INDEX idx_delay_predictions_order_id ON delay_predictions(order_id)');
        DB::statement('CREATE INDEX idx_delay_predictions_risk_score ON delay_predictions(sla_risk_score DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('delay_predictions');
    }
};

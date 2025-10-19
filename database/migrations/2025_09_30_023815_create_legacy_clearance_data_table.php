<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('legacy_clearance_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legacy_scraped_data_id')->constrained('legacy_scraped_data')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('semester_id');
            $table->string('semester_label');
            $table->integer('clearance_id');
            $table->integer('clearance_area_id');
            $table->string('clearance_area_label');
            $table->integer('sort_order')->nullable();
            $table->integer('status_code')->nullable();
            $table->json('requirements'); // All requirements for this clearance area
            $table->integer('total_requirements')->default(0);
            $table->integer('cleared_requirements')->default(0);
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->boolean('all_cleared')->default(false);
            $table->timestamp('scraped_at');
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'semester_id']);
            $table->index(['clearance_id', 'clearance_area_id']);
            $table->index(['all_cleared']);
            $table->index(['scraped_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_clearance_data');
    }
};

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
        Schema::create('legacy_scraped_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('school_id')->nullable();
            $table->string('current_semester_id')->nullable();
            $table->json('semesters_data'); // All available semesters
            $table->json('student_info')->nullable(); // Student lookup data
            $table->json('init_params')->nullable(); // Academic record init params
            $table->boolean('scraping_success')->default(false);
            $table->json('scraping_errors')->nullable(); // Array of errors if any
            $table->timestamp('scraped_at');
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['user_id', 'scraped_at']);
            $table->index(['school_id']);
            $table->index(['current_semester_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_scraped_data');
    }
};

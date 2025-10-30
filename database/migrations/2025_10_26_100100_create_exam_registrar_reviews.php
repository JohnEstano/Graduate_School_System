<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_registrar_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('exam_application_id')->index();
            // Checklist (boolean flags)
            $table->boolean('doc_photo_clear')->default(false);
            $table->boolean('doc_transcript')->default(false);
            $table->boolean('doc_psa_birth')->default(false);
            $table->boolean('doc_honorable_dismissal')->default(false);
            $table->boolean('doc_prof_exam')->default(false); // optional
            $table->boolean('doc_marriage_cert')->default(false); // optional

            // Derived flags captured at review time
            $table->boolean('documents_complete')->default(false);
            $table->boolean('grades_complete')->default(false);

            // Decision
            $table->string('status')->default('pending'); // pending|approved|rejected
            $table->text('reason')->nullable();

            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamps();

            $table->foreign('exam_application_id')->references('application_id')->on('exam_application')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_registrar_reviews');
    }
};
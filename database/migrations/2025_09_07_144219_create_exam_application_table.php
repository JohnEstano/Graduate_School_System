<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_application', function (Blueprint $table) {
            $table->bigIncrements('application_id');

            // Student reference (string since you sometimes use school_id or user id)
            $table->string('student_id');

            $table->string('school_year')->nullable();
            $table->string('program');

            // Permit + approval
            $table->string('permit_status')->default('pending');
            $table->dateTime('permit_DATE')->nullable();
            $table->text('permit_reason')->nullable();

            $table->string('final_approval_status')->default('pending');
            $table->dateTime('final_approval_DATE')->nullable();

            // Meta
            $table->string('approved_by')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('telephone_number')->nullable();
            $table->string('office_address')->nullable();

            // Timestamps
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            // Indexes
            $table->index('student_id');
            $table->index('program');
            $table->index('created_at');
            $table->index('final_approval_status');
            $table->index('permit_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_application');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comprehensive_exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('school_id')->index();
            $table->string('first_name');
            $table->string('middle_initial')->nullable();
            $table->string('last_name');
            $table->string('school_year');
            $table->string('program');
            $table->string('office_address')->nullable();
            $table->string('mobile_no')->nullable();
            $table->string('telephone_no')->nullable();
            $table->string('email');
            $table->json('subjects'); // [{ subject, date, startTime, endTime }]
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprehensive_exams');
    }
};
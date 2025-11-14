<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('panelist_student_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('panelist_id');
            $table->unsignedBigInteger('student_id');
            $table->string('role');
            $table->timestamps();

            $table->foreign('panelist_id')->references('id')->on('panelist_records')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('student_records')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('panelist_student_records');
    }
};

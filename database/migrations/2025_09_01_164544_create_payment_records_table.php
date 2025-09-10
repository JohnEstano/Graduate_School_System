<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_record_id');
            $table->string('school_year');
            $table->date('payment_date');
            $table->string('defense_status');
            $table->decimal('amount', 10, 2);
            $table->timestamps();

            $table->foreign('student_record_id')
                  ->references('id')
                  ->on('student_records')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_records');
    }
};

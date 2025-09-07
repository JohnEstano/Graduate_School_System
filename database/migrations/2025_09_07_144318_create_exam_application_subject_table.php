<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_application_subject', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('application_id');

            $table->string('subject_code')->nullable();
            $table->string('subject_name')->nullable();
            $table->string('status')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('application_id')
                  ->references('application_id')->on('exam_application')
                  ->cascadeOnDelete();

            $table->index(['application_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
        });

        Schema::dropIfExists('exam_application_subject');
    }
};
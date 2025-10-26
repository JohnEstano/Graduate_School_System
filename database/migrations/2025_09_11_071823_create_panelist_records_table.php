<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('panelist_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_record_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('pfirst_name');
            $table->string('pmiddle_name')->nullable();
            $table->string('plast_name');

            $table->string('role');
            $table->string('defense_type');
            $table->date('received_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('panelist_records');
    }
};

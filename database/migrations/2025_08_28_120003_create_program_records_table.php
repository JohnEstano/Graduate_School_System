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
        Schema::create('program_records', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program');
            $table->string('recently_updated', 100);
            $table->string('time_last_opened', 20);
            $table->date('date_edited');
            $table->timestamps(); 
           
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_records');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_records', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program');
            $table->string('category')->nullable();
            $table->string('recently_updated', 100)->nullable();
            $table->string('time_last_opened', 20)->nullable();
            $table->date('date_edited')->nullable();
            $table->timestamps();
        });

        // 🧠 Load program data from external file
        $records = include database_path('static/program_data.php');

        // 🪄 Insert with timestamps automatically
        foreach ($records as &$record) {
            $record['created_at'] = now();
            $record['updated_at'] = now();
        }

        DB::table('program_records')->insert($records);
    }

    public function down(): void
    {
        Schema::dropIfExists('program_records');
    }
};

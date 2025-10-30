<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_records', function (Blueprint $table) {
            $table->foreignId('defense_request_id')->nullable()->constrained()->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('student_records', function (Blueprint $table) {
            $table->dropForeign(['defense_request_id']);
            $table->dropColumn('defense_request_id');
        });
    }
};
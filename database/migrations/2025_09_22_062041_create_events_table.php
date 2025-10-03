<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->timestamp('start_at');
                $table->timestamp('end_at')->nullable();
                $table->boolean('all_day')->default(false);
                $table->string('type')->default('general'); // general | defense
                $table->string('color')->nullable();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('visibility')->default('public'); // future: program, private
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('events');
    }
};

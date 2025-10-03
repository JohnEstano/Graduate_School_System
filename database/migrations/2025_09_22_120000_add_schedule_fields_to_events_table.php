<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Core scheduling fields
            if (!Schema::hasColumn('events','start_at')) {
                $table->dateTime('start_at')->index()->after('id');
            }
            if (!Schema::hasColumn('events','end_at')) {
                $table->dateTime('end_at')->nullable()->after('start_at');
            }
            if (!Schema::hasColumn('events','all_day')) {
                $table->boolean('all_day')->default(false)->after('end_at');
            }

            // Descriptive
            if (!Schema::hasColumn('events','description')) {
                $table->text('description')->nullable()->after('title');
            }

            // Classification
            if (!Schema::hasColumn('events','type')) {
                $table->string('type',40)->nullable()->after('all_day');
            }
            if (!Schema::hasColumn('events','color')) {
                $table->string('color',20)->nullable()->after('type');
            }

            // Ownership
            if (!Schema::hasColumn('events','created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('color');
                $table->foreign('created_by')
                      ->references('id')->on('users')
                      ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop FKs first if they exist
            if (Schema::hasColumn('events','created_by')) {
                try {
                    $table->dropForeign(['created_by']);
                } catch (\Throwable $e) {}
            }
            foreach (['start_at','end_at','all_day','description','type','color','created_by'] as $col) {
                if (Schema::hasColumn('events',$col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
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
        Schema::table('document_templates', function (Blueprint $table) {
            // Only add the column if it doesn't already exist
            if (!Schema::hasColumn('document_templates', 'fields_meta')) {
                $table->json('fields_meta')->nullable()->after('fields');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            if (Schema::hasColumn('document_templates', 'fields_meta')) {
                $table->dropColumn('fields_meta');
            }
        });
    }
};

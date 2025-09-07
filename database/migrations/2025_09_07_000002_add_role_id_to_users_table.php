<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles');
        });

        // Backfill role_id from existing users.role (string) if present
        if (Schema::hasColumn('users', 'role')) {
            $map = DB::table('roles')->pluck('id', 'name'); // ['Student' => 1, ...]
            foreach ($map as $name => $id) {
                DB::table('users')->where('role', $name)->update(['role_id' => $id]);
            }
        }

        // Optionally drop old string column after verifying front-end uses role_id
        // Schema::table('users', function (Blueprint $table) { $table->dropColumn('role'); });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
        });
    }
};
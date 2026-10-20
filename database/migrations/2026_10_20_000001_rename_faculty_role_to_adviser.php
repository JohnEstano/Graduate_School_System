<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->renameRole('Faculty', 'Adviser');
    }

    public function down(): void
    {
        $this->renameRole('Adviser', 'Faculty');
    }

    private function renameRole(string $from, string $to): void
    {
        DB::transaction(function () use ($from, $to) {
            $old = DB::table('roles')->where('name', $from)->first();
            $new = DB::table('roles')->where('name', $to)->first();
            if ($old && $new) {
                if (Schema::hasTable('role_user')) {
                    foreach (DB::table('role_user')->where('role_id', $old->id)->pluck('user_id') as $userId) {
                        DB::table('role_user')->updateOrInsert(['user_id' => $userId, 'role_id' => $new->id], []);
                    }
                    DB::table('role_user')->where('role_id', $old->id)->delete();
                }
                if (Schema::hasColumn('users', 'role_id')) {
                    DB::table('users')->where('role_id', $old->id)->update(['role_id' => $new->id]);
                }
                DB::table('roles')->where('id', $old->id)->delete();
            } elseif ($old) {
                DB::table('roles')->where('id', $old->id)->update(['name' => $to]);
            }
            DB::table('users')->where('role', $from)->update(['role' => $to]);
        });
    }
};

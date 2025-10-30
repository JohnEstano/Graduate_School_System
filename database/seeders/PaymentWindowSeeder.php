<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentWindowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if payment_window_open setting already exists
        $exists = DB::table('system_settings')
            ->where('key', 'payment_window_open')
            ->exists();

        if (!$exists) {
            DB::table('system_settings')->insert([
                'key' => 'payment_window_open',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Controls whether students can submit comprehensive exam payment receipts',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            echo "✅ payment_window_open setting created successfully\n";
        } else {
            echo "ℹ️  payment_window_open setting already exists\n";
        }
    }
}

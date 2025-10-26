<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (Schema::hasTable('panelist_student_records')) {
    echo "PANELIST_STUDENT_RECORDS TABLE (Pivot):\n";
    $columns = DB::select('DESCRIBE panelist_student_records');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "panelist_student_records pivot table DOES NOT EXIST!\n";
    echo "You need to create a migration for this table.\n";
}

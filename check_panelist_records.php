<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (Schema::hasTable('panelist_records')) {
    echo "PANELIST_RECORDS TABLE:\n";
    $columns = DB::select('DESCRIBE panelist_records');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "panelist_records table does not exist!\n";
}

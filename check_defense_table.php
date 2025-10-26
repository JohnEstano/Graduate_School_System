<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "\n";
echo "Defense Requests Table Structure:\n";
echo "===================================\n\n";

$columns = DB::select("DESCRIBE defense_requests");

foreach ($columns as $column) {
    echo "{$column->Field}\n";
    echo "  Type: {$column->Type}\n";
    echo "  Null: {$column->Null}\n";
    echo "  Default: {$column->Default}\n\n";
}

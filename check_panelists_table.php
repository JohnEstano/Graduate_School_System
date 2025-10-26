<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "Panelists Table Structure:\n";
echo "===================================\n\n";

$columns = DB::select("DESCRIBE panelists");

foreach ($columns as $column) {
    echo "{$column->Field}\n";
    echo "  Type: {$column->Type}\n";
    echo "  Null: {$column->Null}\n\n";
}

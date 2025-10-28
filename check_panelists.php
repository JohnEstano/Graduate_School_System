<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Panelists Table Structure ===\n";
$columns = DB::select("DESCRIBE panelists");
foreach ($columns as $col) {
    echo $col->Field . " (" . $col->Type . ")\n";
}

echo "\n=== All Panelists in Database ===\n\n";
$panelists = DB::table('panelists')->get();

if ($panelists->isEmpty()) {
    echo "No panelists found in database.\n";
} else {
    foreach ($panelists as $p) {
        echo "ID: " . $p->id . "\n";
        foreach ((array)$p as $key => $value) {
            if ($key !== 'id') {
                echo "  $key: " . ($value ?? 'NULL') . "\n";
            }
        }
        echo "\n";
    }
}

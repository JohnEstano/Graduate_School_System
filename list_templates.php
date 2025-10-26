<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// List all templates
$templates = DB::table('document_templates')->get();

echo "Available templates:\n";
foreach ($templates as $t) {
    echo "  ID: {$t->id}, Name: {$t->name}, Code: {$t->code}\n";
}

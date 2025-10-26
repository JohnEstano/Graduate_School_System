<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== DATABASE STRUCTURE CHECK ===\n\n";

// Check panelists table
echo "PANELISTS TABLE:\n";
if (Schema::hasTable('panelists')) {
    $columns = DB::select('DESCRIBE panelists');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n";

// Check program_records table
echo "PROGRAM_RECORDS TABLE:\n";
if (Schema::hasTable('program_records')) {
    $columns = DB::select('DESCRIBE program_records');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n";

// Check student_records table
echo "STUDENT_RECORDS TABLE:\n";
if (Schema::hasTable('student_records')) {
    $columns = DB::select('DESCRIBE student_records');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n";

// Check payment_records table
echo "PAYMENT_RECORDS TABLE:\n";
if (Schema::hasTable('payment_records')) {
    $columns = DB::select('DESCRIBE payment_records');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n";

// Check honorarium_payments table
echo "HONORARIUM_PAYMENTS TABLE:\n";
if (Schema::hasTable('honorarium_payments')) {
    $columns = DB::select('DESCRIBE honorarium_payments');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n";

// Check defense_requests table
echo "DEFENSE_REQUESTS TABLE:\n";
if (Schema::hasTable('defense_requests')) {
    $columns = DB::select('DESCRIBE defense_requests');
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
} else {
    echo "  Table does not exist!\n";
}

echo "\n=== END ===\n";

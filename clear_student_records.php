<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;
use Illuminate\Support\Facades\DB;

echo "=== CLEARING ALL STUDENT/PANELIST/PAYMENT RECORDS ===\n\n";

DB::beginTransaction();

try {
    // Get counts before deletion
    $studentCount = StudentRecord::count();
    $panelistCount = PanelistRecord::count();
    $paymentCount = PaymentRecord::count();
    
    echo "Current records:\n";
    echo "  - Student Records: {$studentCount}\n";
    echo "  - Panelist Records: {$panelistCount}\n";
    echo "  - Payment Records: {$paymentCount}\n\n";
    
    // Delete all records (cascade will handle related records)
    echo "Deleting all records...\n";
    
    // Delete payment records first (they have foreign keys)
    DB::table('payment_records')->delete();
    echo "  ✅ Payment records deleted\n";
    
    // Delete pivot table records
    DB::table('panelist_student_records')->delete();
    echo "  ✅ Panelist-Student pivot records deleted\n";
    
    // Delete panelist records
    DB::table('panelist_records')->delete();
    echo "  ✅ Panelist records deleted\n";
    
    // Delete student records
    DB::table('student_records')->delete();
    echo "  ✅ Student records deleted\n";
    
    DB::commit();
    
    echo "\n✅ All records cleared successfully!\n";
    echo "\nYou can now test the sync by setting AA status to 'ready_for_finance'\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ Error: {$e->getMessage()}\n";
    echo "Stack trace:\n{$e->getTraceAsString()}\n";
}

echo "\n=== DONE ===\n";

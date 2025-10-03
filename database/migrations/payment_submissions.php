<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_submissions', function (Blueprint $table) {
            // Matches your diagram
            $table->increments('payment_id');

            // If you actually have a "students" table, change 'users' below to 'students'
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            $table->string('or_number', 50);
            $table->decimal('amount_paid', 10, 2)->default(0); // not in UI, defaulted
            $table->date('payment_date');

            $table->enum('payment_type', ['exam'])->default('exam');
            $table->string('receipt_image', 255)->nullable();

            // If you have a GraduateSchoolUser table, adjust this FK accordingly
            $table->foreignId('checked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('checked_at')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();

            $table->timestamps();

            // Prevent duplicate exam payments per student
            $table->unique(['student_id', 'payment_type']);
            $table->index(['status', 'payment_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_submissions');
    }
};


return [
    // Adjust to your actual comprehensive exam fee
    'compre_exam_fee' => env('COMPRE_EXAM_FEE', 0.00),
];
<?php
// filepath: c:\GSURS\Graduate_School_System-1\database\migrations\2025_10_26_000001_create_exam_dean_reviews_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_dean_reviews', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('exam_application_id');
            $t->enum('status', ['approved','rejected']);
            $t->string('reason', 500)->nullable();
            $t->unsignedBigInteger('reviewed_by')->nullable();
            $t->timestamps();

            $t->index('exam_application_id');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('exam_dean_reviews');
    }
};
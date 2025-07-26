<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('defense_requests', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('school_id');
            $table->string('program');
            $table->string('thesis_title');
            $table->date('date_of_defense');
            $table->string('mode_defense');
            $table->string('defense_type');
            $table->string('advisers_endorsement')->nullable();
            $table->string('rec_endorsement')->nullable();
            $table->string('proof_of_payment')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('defense_adviser');
            $table->string('defense_chairperson');
            $table->string('defense_panelist1');
            $table->string('defense_panelist2')->nullable();
            $table->string('defense_panelist3')->nullable();
            $table->string('defense_panelist4')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('defense_requests');
    }
};

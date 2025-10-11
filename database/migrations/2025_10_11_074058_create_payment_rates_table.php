<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payment_rates', function (Blueprint $table) {
            $table->id();
            $table->string('program_level'); // 'Masteral' or 'Doctorate'
            $table->string('type'); // Adviser, Panel Chair, Panel Member, REC Fee, School Share, etc.
            $table->string('defense_type'); // Proposal, Pre-final, Final
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('payment_rates');
    }
};

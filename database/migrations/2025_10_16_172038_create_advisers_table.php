<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdvisersTable extends Migration
{
    public function up()
    {
        Schema::create('advisers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('coordinator_id');
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('employee_id')->nullable();
            $table->enum('status', ['inactive', 'active'])->default('inactive');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->foreign('coordinator_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('advisers');
    }
}

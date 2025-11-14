<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void {
    Schema::create('document_templates', function (Blueprint $t) {
      $t->id();
      $t->string('name');
      $t->string('code')->unique();              // proposal_endorsement
      $t->string('defense_type')->nullable();    // Proposal|Prefinal|Final
      $t->string('file_path');
      $t->unsignedInteger('page_count')->default(1);
      $t->unsignedInteger('version')->default(1);
      $t->json('fields')->nullable();            // stored JSON field descriptors
      $t->json('fields_meta')->nullable();       // canvas dimensions and other metadata
      $t->foreignId('created_by')->constrained('users');
      $t->timestamps();
    });

    Schema::create('user_signatures', function (Blueprint $t) {
      $t->id();
      $t->foreignId('user_id')->constrained()->cascadeOnDelete();
      $t->string('label')->default('Primary');
      $t->string('image_path');
      $t->unsignedInteger('natural_width')->nullable();
      $t->unsignedInteger('natural_height')->nullable();
      $t->boolean('active')->default(true);
      $t->timestamps();
    });

    Schema::create('generated_documents', function (Blueprint $t) {
      $t->id();
      $t->foreignId('defense_request_id')->constrained()->cascadeOnDelete();
      $t->foreignId('document_template_id')->constrained()->cascadeOnDelete();
      $t->unsignedInteger('template_version_used');
      $t->string('output_path');
      $t->string('sha256')->nullable();
      $t->json('payload');
      $t->string('status')->default('generated'); // generated|revoked
      $t->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void {
    Schema::dropIfExists('generated_documents');
    Schema::dropIfExists('user_signatures');
    Schema::dropIfExists('document_templates');
  }
};

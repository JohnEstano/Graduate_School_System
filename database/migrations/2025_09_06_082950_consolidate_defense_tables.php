<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, add missing fields to defense_requests table
        Schema::table('defense_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('defense_requests', 'manuscript_proposal')) {
                $table->string('manuscript_proposal')->nullable()->after('advisers_endorsement');
            }
            if (!Schema::hasColumn('defense_requests', 'similarity_index')) {
                $table->string('similarity_index')->nullable()->after('manuscript_proposal');
            }
        });

        // Migrate all data from defense_requirements to defense_requests
        $requirements = DB::table('defense_requirements')->get();
        
        foreach ($requirements as $req) {
            // Map adviser name to user ID if possible
            $adviserUserId = null;
            $assignedToUserId = null;
            
            if ($req->adviser) {
                $adviserUser = DB::table('users')
                    ->where('role', 'Faculty')
                    ->where(function($query) use ($req) {
                        $adviserName = $req->adviser;
                        $query->whereRaw('CONCAT(first_name, " ", last_name) = ?', [$adviserName])
                              ->orWhereRaw('CONCAT(last_name, ", ", first_name) = ?', [$adviserName]);
                        
                        // Handle name parts
                        $nameParts = explode(' ', $adviserName);
                        if (count($nameParts) >= 2) {
                            $firstName = $nameParts[0];
                            $lastName = end($nameParts);
                            $query->orWhere(function($q) use ($firstName, $lastName) {
                                $q->where('first_name', 'LIKE', '%' . $firstName . '%')
                                  ->where('last_name', 'LIKE', '%' . $lastName . '%');
                            });
                        }
                    })
                    ->first();
                    
                if ($adviserUser) {
                    $adviserUserId = $adviserUser->id;
                    $assignedToUserId = $adviserUser->id;
                }
            }

            // Check if this record already exists in defense_requests
            $existing = DB::table('defense_requests')
                ->where('first_name', $req->first_name)
                ->where('last_name', $req->last_name)
                ->where('thesis_title', $req->thesis_title)
                ->first();

            if (!$existing) {
                // Insert new record into defense_requests
                DB::table('defense_requests')->insert([
                    'first_name' => $req->first_name,
                    'middle_name' => $req->middle_name,
                    'last_name' => $req->last_name,
                    'school_id' => $req->school_id,
                    'program' => $req->program,
                    'thesis_title' => $req->thesis_title,
                    'defense_type' => $req->defense_type ?? 'Proposal',
                    'defense_adviser' => $req->adviser,
                    'rec_endorsement' => $req->rec_endorsement,
                    'proof_of_payment' => $req->proof_of_payment,
                    'reference_no' => $req->reference_no,
                    'manuscript_proposal' => $req->manuscript_proposal ?? null,
                    'similarity_index' => $req->similarity_index ?? null,
                    'submitted_by' => $req->user_id,
                    'status' => ucfirst($req->status ?? 'Pending'),
                    'priority' => 'Medium',
                    'workflow_state' => $req->status === 'pending' ? 'adviser-review' : 'coordinator-review',
                    'adviser_user_id' => $adviserUserId,
                    'assigned_to_user_id' => $assignedToUserId,
                    'created_at' => $req->created_at,
                    'updated_at' => $req->updated_at,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the added columns
        Schema::table('defense_requests', function (Blueprint $table) {
            if (Schema::hasColumn('defense_requests', 'manuscript_proposal')) {
                $table->dropColumn('manuscript_proposal');
            }
            if (Schema::hasColumn('defense_requests', 'similarity_index')) {
                $table->dropColumn('similarity_index');
            }
        });
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseRequirement extends Model
{
    protected $fillable = [
        'user_id',
        'first_name', 'middle_name', 'last_name', 'school_id', 'program', 'thesis_title',
        'adviser', 'status', 'rec_endorsement', 'proof_of_payment', 'reference_no',
        'manuscript_proposal', 'similarity_index', 'defense_type'
    ];
}

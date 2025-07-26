<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseRequest extends Model
{
    protected $fillable = [
        'first_name', 'middle_name', 'last_name',
        'school_id', 'program', 'thesis_title', 'date_of_defense',
        'mode_defense', 'defense_type',
        'advisers_endorsement', 'rec_endorsement', 'proof_of_payment', 'reference_no',
        'defense_adviser', 'defense_chairperson',
        'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4',
    ];
}

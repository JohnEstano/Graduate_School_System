<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegacyStudentInfo extends Model
{
    protected $table = 'legacy_student_info';
    protected $fillable = [
        'user_id',
        'student_id',
        'degree_program_id',
    ];
    public function user() { return $this->belongsTo(User::class); }
}

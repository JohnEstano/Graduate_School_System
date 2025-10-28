<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PanelistRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_record_id', 
        'pfirst_name', 
        'pmiddle_name', 
        'plast_name', 
        'role', 
        'received_date'
    ];

    public function program()
    {
        return $this->belongsTo(ProgramRecord::class, 'program_record_id');
    }

    public function payments()
    {
        return $this->hasMany(\App\Models\PaymentRecord::class, 'panelist_record_id');
    }

    public function students()
    {
        return $this->belongsToMany(StudentRecord::class, 'panelist_student_records', 'panelist_id', 'student_id')
            ->withPivot('role')
            ->withTimestamps();
    }
}

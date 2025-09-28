<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramRecord extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name', 
        'program', 
        'category', 
        'date_edited'
    ];

    protected $casts = [
        'date_edited' => 'datetime',
    ];

    public function studentRecords()
    {
        return $this->hasMany(StudentRecord::class, 'program_record_id');
    }

    public function panelists()
    {
        return $this->hasMany(PanelistRecord::class, 'program_record_id');
    }
}
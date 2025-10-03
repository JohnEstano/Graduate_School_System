<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramRecord extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'program', 'category', 'date_edited'];
}

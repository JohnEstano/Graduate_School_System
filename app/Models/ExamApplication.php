<?php
// filepath: c:\GSPS\Graduate_School_System\app\Models\ExamApplication.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamApplication extends Model
{
    protected $table = 'exam_application';
    protected $primaryKey = 'application_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'school_year',
        'permit_status',
        'permit_DATE',
        'permit_reason',
        'final_approval_status',
        'final_approval_DATE',
        'approved_by',
        'contact_number',
        'telephone_number',
        'office_address',
        'program',
        'created_at',
    ];

    public function subjects(): HasMany
    {
        return $this->hasMany(ExamApplicationSubject::class, 'application_id', 'application_id');
    }
}
<?php
// filepath: c:\GSPS\Graduate_School_System\app\Models\ExamApplication.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamApplication extends Model
{
    protected $table = 'exam_application';
    protected $primaryKey = 'application_id';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $guarded = [];
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

    // Relationship for subjects (already likely present; ensure name matches)
    public function subjects(): HasMany
    {
        return $this->hasMany(\App\Models\ExamApplicationSubject::class, 'application_id', 'application_id');
    }

    // Registrar reviews history
    public function registrarReviews(): HasMany
    {
        return $this->hasMany(\App\Models\ExamRegistrarReview::class, 'exam_application_id', 'application_id');
    }

    // Latest registrar review (used by list API)
    public function latestRegistrarReview(): HasOne
    {
        return $this->hasOne(\App\Models\ExamRegistrarReview::class, 'exam_application_id', 'application_id')->latestOfMany();
    }

    // Payment submission for this exam application
    public function paymentSubmission(): HasOne
    {
        return $this->hasOne(\App\Models\PaymentSubmission::class, 'exam_application_id', 'application_id');
    }

    
    public function getRouteKeyName(): string
    {
        return 'application_id';
    }
    
}
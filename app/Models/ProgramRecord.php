<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramRecord extends Model
{
    use HasFactory;
    
    protected $fillable = ['name', 'program'];

    const DOCTORATE = 'Doctorate';
    const MASTERS = 'Masters';

        public static function defaultPrograms(): array
    {
        return [
            self::DOCTORATE => [
                'Doctor in Business Management',
                'Doctor in Business Management Specialized in Information Systems',
                'Doctor of Philosophy in Education - Applied Linguistics',
                'Doctor of Philosophy in Education - Educational Leadership',
                'Doctor of Philosophy in Education - Counseling',
                'Doctor of Philosophy in Education - Filipino',
                'Doctor of Philosophy in Education - Information Technology Integration',
                'Doctor of Philosophy in Education - Mathematics',
                'Doctor of Philosophy in Education - Physical Education',
                'Doctor of Philosophy in Pharmacy',
            ],
            self::MASTERS => [
                'Master of Arts in Educational Management',
                'Master of Arts in Elementary Education',
                'Master of Arts in Education - English',
                'Master of Arts in Education - Filipino',
                'Master of Arts in Education - Information Technology Integration',
                'Master of Arts in Education - Mathematics',
                'Master of Arts in Education - Music Education',
                'Master of Arts in Education - Physical Education',
                'Master of Arts in Education - Sociology',
                'Master of Arts in Religious Education',
                'Master of Arts in Values Education',
                'Master of Arts in Teaching Chemistry',
                'Master of Arts in Teaching Physics',
                'Master in Engineering Education - Civil Engineering',
                'Master in Engineering Education - Electronics and Communications Engineering',
                'Master in Information System',
                'Master in Information Technology',
                'Master of Science in Medical Technology - Biomedical Science',
                'Master of Science in Medical Technology - Laboratory Leadership and Management',
                'Master of Science in Medical Technology - Medical Laboratory Science Education and Management',
                'Master of Science in Medical Technology - Community Health',
                'Master of Science in Pharmacy',
                'Master of Arts in Counseling',
                'Master in Pastoral Ministry (Non-Thesis) - Family Ministry and Counseling',
                'Master in Pastoral Ministry (Non-Thesis) - Pastoral Management',
                'Master in Pastoral Ministry (Non-Thesis) - Retreat Giving and Spirituality',
            ],
        ];
    }

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
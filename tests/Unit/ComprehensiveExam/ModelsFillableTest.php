<?php

namespace Tests\Unit\ComprehensiveExam;

use App\Models\ExamApplicationSubject;
use App\Models\ExamSubjectOffering;
use PHPUnit\Framework\TestCase;

class ModelsFillableTest extends TestCase
{
    public function test_exam_subject_offering_has_proctor_fillable()
    {
        $model = new ExamSubjectOffering();
        $this->assertTrue(in_array('proctor', $model->getFillable()), 'proctor should be fillable');
    }

    public function test_exam_application_subject_has_score_fillable()
    {
        $model = new ExamApplicationSubject();
        $this->assertTrue(in_array('score', $model->getFillable()), 'score should be fillable');
    }
}
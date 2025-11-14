<?php

namespace Tests\Feature\ComprehensiveExam;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RegistrarRetrieveDecisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_registrar_can_retrieve_decision_to_pending()
    {
        // Seed a decided application
        DB::table('exam_application')->insert([
            'application_id' => 9,
            'student_id' => 'PHD-0001',
            'registrar_status' => 'rejected',
            'registrar_reason' => 'Missing doc',
        ]);

        $registrar = User::factory()->create(['role' => 'Registrar']);
        $this->actingAs($registrar);

        $res = $this->post('/registrar/exam-applications/9/retrieve');
        $res->assertStatus(201);

        $app = DB::table('exam_application')->where('application_id', 9)->first();
        $this->assertEquals('pending', $app->registrar_status);
        $this->assertNull($app->registrar_reason);
    }
}
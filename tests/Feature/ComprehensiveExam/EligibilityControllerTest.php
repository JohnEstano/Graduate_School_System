<?php

namespace Tests\Feature\ComprehensiveExam;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

class EligibilityControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // If you use migrations for core tables, keep them. Otherwise, comment out and seed minimal rows in each test.
    }

    public function test_status_endpoint_returns_open_key()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $res = $this->get('/api/comprehensive-exam/status');
        $res->assertStatus(200)
            ->assertJsonStructure(['open'])
            ->assertJson(fn ($json) => $json->whereType('open', 'boolean'));
    }

    public function test_eligibility_uses_bearer_token_and_parses_grades_and_tuition()
    {
        $user = User::factory()->create([
            'student_number' => 'PHDITI-02232407',
            'school_id'      => 'PHDITI-02232407',
        ]);
        $this->actingAs($user);

        // Save token and identifier as the app does on UIC login
        Session::put('token', 'fake-bearer-token');
        Session::put('login_student_number', 'PHDITI-02232407');

        Http::fake([
            // Grades clearance
            'api.uic.edu.ph/*/students-portal/students/*/clearance/grades' => Http::response([
                'data' => ['cleared' => true],
            ], 200),
            // Tuition clearance
            'api.uic.edu.ph/*/students-portal/students/*/clearance/tuition' => Http::response([
                'data' => ['has_outstanding_balance' => false],
            ], 200),
            // Schedules (optional)
            'api.uic.edu.ph/*/students-portal/class-schedules/*' => Http::response([
                'data' => [],
            ], 200),
        ]);

        $res = $this->get('/api/comprehensive-exam/eligibility');
        $res->assertStatus(200)
            ->assertJson(fn ($json) =>
                $json->where('gradesComplete', true)
                     ->where('noOutstandingBalance', true)
                     ->etc()
            );
    }
}
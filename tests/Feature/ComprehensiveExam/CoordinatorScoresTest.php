<?php
namespace Tests\Feature\ComprehensiveExam;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;

class CoordinatorScoresTest extends TestCase
{
    use RefreshDatabase;

    protected function seedExamData(): array
    {
        // Minimal tables
        DB::table('users')->insert([
            'id' => 1,
            'name' => 'Coordinator',
            'email' => 'coord@example.com',
            'password' => bcrypt('secret'),
            'role' => 'Coordinator',
        ]);

        // Exam application
        DB::table('exam_application')->insert([
            'application_id' => 7,
            'student_id' => 'PHDITI-02232407',
            'final_approval_status' => 'approved',
        ]);

        // Subjects table can be subject_id or id; insert both columns safely
        $hasId = schema()->hasColumn('exam_application_subject', 'id');
        $pkCol = $hasId ? 'id' : 'subject_id';

        DB::table('exam_application_subject')->insert([
            $pkCol => 101,
            'application_id' => 7,
            'subject_name' => 'PhD ITI 620',
        ]);
        DB::table('exam_application_subject')->insert([
            $pkCol => 102,
            'application_id' => 7,
            'subject_name' => 'PhD ITI 619',
        ]);

        return ['pk' => $pkCol, 'ids' => [101, 102]];
    }

    public function test_get_subjects_for_application()
    {
        $meta = $this->seedExamData();
        $coord = User::factory()->create(['role' => 'Coordinator']);
        $this->actingAs($coord);

        $res = $this->get('/api/exam-applications/7/subjects');
        $res->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has(2)
                     ->first(fn ($j) => $j->hasAll(['id','subject_name'])->etc())
            );
    }

    public function test_post_scores_updates_average_and_auto_fails_on_74_or_below()
    {
        $meta = $this->seedExamData();
        $coord = User::factory()->create(['role' => 'Coordinator']);
        $this->actingAs($coord);

        // Post scores 70 and 74 → average 72 → should fail
        $payload = [
            'scores' => [
                ['id' => 101, 'score' => 70],
                ['id' => 102, 'score' => 74],
            ],
        ];

        $res = $this->postJson('/coordinator/exam-applications/7/scores', $payload);
        $res->assertStatus(200)
            ->assertJson(fn ($json) =>
                $json->where('average', 72)
                     ->where('result', 'failed')
                     ->etc()
            );

        // Application should be rejected and average stored when columns exist
        $app = DB::table('exam_application')->where('application_id', 7)->first();
        $this->assertNotNull($app);
        if (schema()->hasColumn('exam_application', 'average_score')) {
            $this->assertEquals(72, (int) $app->average_score);
        }
        if (schema()->hasColumn('exam_application', 'result_status')) {
            $this->assertEquals('failed', $app->result_status);
        }
        if (schema()->hasColumn('exam_application', 'final_approval_status')) {
            $this->assertEquals('rejected', $app->final_approval_status);
        }

        // Subjects got scores
        $rows = DB::table('exam_application_subject')->where('application_id', 7)->get();
        $this->assertEquals([70, 74], $rows->pluck('score')->sort()->values()->all());
    }

    protected function schema()
    {
        return app('db.schema');
    }
}
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\Api\StudentSearchController;
use Illuminate\Http\Request;

class TestStudentSearchCommand extends Command
{
    protected $signature = 'debug:student-search {query}';
    protected $description = 'Test the student search functionality';

    public function handle()
    {
        $query = $this->argument('query');
        
        $this->info("Testing student search for query: '{$query}'");
        
        // Create a mock request
        $request = new Request();
        $request->merge(['q' => $query]);
        
        $controller = new StudentSearchController();
        $response = $controller->search($request);
        
        $data = $response->getData(true);
        
        $this->line("Found " . count($data) . " students:");
        
        foreach ($data as $student) {
            $this->line("- {$student['display_name']} ({$student['email']}) - {$student['school_id']}");
        }
        
        return 0;
    }
}
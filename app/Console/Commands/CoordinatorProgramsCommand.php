<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CoordinatorProgramService;

class CoordinatorProgramsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'coordinator:programs 
                           {--email= : Get programs for specific coordinator email}
                           {--program= : Find coordinator for specific program}
                           {--search= : Search programs by keyword}
                           {--stats : Show coordinator workload statistics}
                           {--list : List all coordinators and their programs}
                           {--export : Export data for seeding}';

    /**
     * The console command description.
     */
    protected $description = 'Query and manage coordinator program assignments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Check if specific email was requested
        if ($email = $this->option('email')) {
            $this->showProgramsForEmail($email);
            return;
        }

        // Check if program search was requested
        if ($program = $this->option('program')) {
            $this->findCoordinatorForProgram($program);
            return;
        }

        // Check if keyword search was requested
        if ($search = $this->option('search')) {
            $this->searchPrograms($search);
            return;
        }

        // Check if stats were requested
        if ($this->option('stats')) {
            $this->showStatistics();
            return;
        }

        // Check if export was requested
        if ($this->option('export')) {
            $this->exportData();
            return;
        }

        // Default: List all coordinators
        if ($this->option('list') || !$this->hasOptions()) {
            $this->listAllCoordinators();
            return;
        }
    }

    /**
     * Show programs for a specific coordinator email
     */
    private function showProgramsForEmail(string $email)
    {
        if (!CoordinatorProgramService::isCoordinator($email)) {
            $this->error("❌ Email '{$email}' is not a registered coordinator.");
            return;
        }

        $programs = CoordinatorProgramService::getProgramsByEmail($email);
        
        $this->info("📧 Coordinator: {$email}");
        $this->info("📚 Programs Assigned (" . count($programs) . "):");
        
        foreach ($programs as $index => $program) {
            $code = CoordinatorProgramService::generateProgramCode($program);
            $this->line("   " . ($index + 1) . ". [{$code}] {$program}");
        }
    }

    /**
     * Find coordinator for a specific program
     */
    private function findCoordinatorForProgram(string $program)
    {
        $coordinator = CoordinatorProgramService::getCoordinatorByProgram($program);
        
        if ($coordinator) {
            $this->info("📚 Program: {$program}");
            $this->info("👥 Coordinator: {$coordinator}");
        } else {
            $this->error("❌ No coordinator found for program '{$program}'.");
            $this->line("💡 Try using --search to find similar programs.");
        }
    }

    /**
     * Search programs by keyword
     */
    private function searchPrograms(string $search)
    {
        $results = CoordinatorProgramService::searchPrograms($search);
        
        if (empty($results)) {
            $this->error("❌ No programs found containing '{$search}'.");
            return;
        }

        $this->info("🔍 Programs containing '{$search}' (" . count($results) . " found):");
        
        foreach ($results as $result) {
            $code = CoordinatorProgramService::generateProgramCode($result['program_name']);
            $this->line("   • [{$code}] {$result['program_name']}");
            $this->line("     👥 Coordinator: {$result['coordinator_email']}");
        }
    }

    /**
     * Show coordinator workload statistics
     */
    private function showStatistics()
    {
        $stats = CoordinatorProgramService::getCoordinatorStats();
        $byLevel = CoordinatorProgramService::getProgramsByDegreeLevel();
        
        $this->info("📊 COORDINATOR WORKLOAD STATISTICS");
        $this->line("");
        
        // Individual coordinator stats
        $this->info("👥 Coordinators by Program Count:");
        foreach ($stats as $stat) {
            $this->line("   • {$stat['coordinator_email']}: {$stat['program_count']} programs");
        }
        
        $this->line("");
        
        // Degree level breakdown
        $this->info("🎓 Programs by Degree Level:");
        foreach ($byLevel as $level => $programs) {
            $this->line("   • {$level}: " . count($programs) . " programs");
        }
        
        $this->line("");
        
        // Overall summary
        $totalCoordinators = count($stats);
        $totalPrograms = array_sum(array_column($stats, 'program_count'));
        $avgPrograms = round($totalPrograms / $totalCoordinators, 1);
        
        $this->info("📈 SUMMARY:");
        $this->line("   • Total Coordinators: {$totalCoordinators}");
        $this->line("   • Total Program Assignments: {$totalPrograms}");
        $this->line("   • Average Programs per Coordinator: {$avgPrograms}");
    }

    /**
     * List all coordinators and their programs
     */
    private function listAllCoordinators()
    {
        $output = CoordinatorProgramService::printAllCoordinators();
        $this->line($output);
    }

    /**
     * Export data for seeding
     */
    private function exportData()
    {
        $data = CoordinatorProgramService::exportForSeeder();
        
        $this->info("📋 COORDINATOR DATA FOR SEEDING:");
        $this->line("");
        
        foreach ($data as $coordinator) {
            $this->line("Email: {$coordinator['email']}");
            $this->line("Role: {$coordinator['role']}");
            $this->line("Programs: {$coordinator['programs']}");
            $this->line("Program Count: {$coordinator['program_count']}");
            $this->line(str_repeat("-", 60));
        }
        
        $this->info("💡 This data can be used to update your coordinator seeder.");
    }

    /**
     * Check if any options were provided
     */
    private function hasOptions(): bool
    {
        $options = ['email', 'program', 'search', 'stats', 'list', 'export'];
        
        foreach ($options as $option) {
            if ($this->option($option)) {
                return true;
            }
        }
        
        return false;
    }
}
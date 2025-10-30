<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentRate;

class PaymentRateSeeder extends Seeder
{
    public function run()
    {
        $rates = [
            // Masteral Rates
            // Proposal Defense
            ['program_level' => 'Masteral', 'type' => 'Adviser', 'defense_type' => 'Proposal', 'amount' => 3000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Chair', 'defense_type' => 'Proposal', 'amount' => 2000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 1', 'defense_type' => 'Proposal', 'amount' => 1200.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 2', 'defense_type' => 'Proposal', 'amount' => 1200.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 3', 'defense_type' => 'Proposal', 'amount' => 1200.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 4', 'defense_type' => 'Proposal', 'amount' => 1200.00],
            ['program_level' => 'Masteral', 'type' => 'REC Fee', 'defense_type' => 'Proposal', 'amount' => 2200.00],
            ['program_level' => 'Masteral', 'type' => 'School Share', 'defense_type' => 'Proposal', 'amount' => 450.00],

            // Pre-final Defense
            ['program_level' => 'Masteral', 'type' => 'Adviser', 'defense_type' => 'Pre-final', 'amount' => 3700.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Chair', 'defense_type' => 'Pre-final', 'amount' => 2500.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 1', 'defense_type' => 'Pre-final', 'amount' => 1500.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 2', 'defense_type' => 'Pre-final', 'amount' => 1500.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 3', 'defense_type' => 'Pre-final', 'amount' => 1500.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 4', 'defense_type' => 'Pre-final', 'amount' => 1500.00],
            ['program_level' => 'Masteral', 'type' => 'REC Fee', 'defense_type' => 'Pre-final', 'amount' => 800.00],
            ['program_level' => 'Masteral', 'type' => 'School Share', 'defense_type' => 'Pre-final', 'amount' => 1280.00],

            // Final Defense
            ['program_level' => 'Masteral', 'type' => 'Adviser', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Chair', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 1', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 2', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 3', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'Panel Member 4', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Masteral', 'type' => 'REC Fee', 'defense_type' => 'Final', 'amount' => 0.00],
            ['program_level' => 'Masteral', 'type' => 'School Share', 'defense_type' => 'Final', 'amount' => 0.00],

            // Doctorate Rates
            // Proposal Defense
            ['program_level' => 'Doctorate', 'type' => 'Adviser', 'defense_type' => 'Proposal', 'amount' => 4000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Chair', 'defense_type' => 'Proposal', 'amount' => 2800.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 1', 'defense_type' => 'Proposal', 'amount' => 1800.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 2', 'defense_type' => 'Proposal', 'amount' => 1800.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 3', 'defense_type' => 'Proposal', 'amount' => 1800.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 4', 'defense_type' => 'Proposal', 'amount' => 1800.00],
            ['program_level' => 'Doctorate', 'type' => 'REC Fee', 'defense_type' => 'Proposal', 'amount' => 2200.00],
            ['program_level' => 'Doctorate', 'type' => 'School Share', 'defense_type' => 'Proposal', 'amount' => 950.00],

            // Pre-final Defense
            ['program_level' => 'Doctorate', 'type' => 'Adviser', 'defense_type' => 'Pre-final', 'amount' => 5000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Chair', 'defense_type' => 'Pre-final', 'amount' => 3500.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 1', 'defense_type' => 'Pre-final', 'amount' => 2100.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 2', 'defense_type' => 'Pre-final', 'amount' => 2100.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 3', 'defense_type' => 'Pre-final', 'amount' => 2100.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 4', 'defense_type' => 'Pre-final', 'amount' => 2100.00],
            ['program_level' => 'Doctorate', 'type' => 'REC Fee', 'defense_type' => 'Pre-final', 'amount' => 800.00],
            ['program_level' => 'Doctorate', 'type' => 'School Share', 'defense_type' => 'Pre-final', 'amount' => 2040.00],

            // Final Defense
            ['program_level' => 'Doctorate', 'type' => 'Adviser', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Chair', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 1', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 2', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 3', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'Panel Member 4', 'defense_type' => 'Final', 'amount' => 1000.00],
            ['program_level' => 'Doctorate', 'type' => 'REC Fee', 'defense_type' => 'Final', 'amount' => 0.00],
            ['program_level' => 'Doctorate', 'type' => 'School Share', 'defense_type' => 'Final', 'amount' => 1000.00],
        ];

        foreach ($rates as $rate) {
            PaymentRate::updateOrCreate(
                [
                    'program_level' => $rate['program_level'],
                    'type' => $rate['type'],
                    'defense_type' => $rate['defense_type'],
                ],
                [
                    'amount' => $rate['amount'],
                ]
            );
        }

        $this->command->info('Payment rates seeded successfully!');
    }
}

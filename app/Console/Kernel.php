<?php
// ...inside class Kernel...
protected $commands = [
    \App\Console\Commands\AutoCompleteDefenses::class,
];

protected function schedule(\Illuminate\Console\Scheduling\Schedule $schedule): void
{
    // Every 5 minutes (adjust as needed)
    $schedule->command('defenses:auto-complete')->everyFiveMinutes();
}
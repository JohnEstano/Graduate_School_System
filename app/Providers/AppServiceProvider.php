<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\DefenseRequest;
use App\Observers\DefenseRequestObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the DefenseRequest observer
        DefenseRequest::observe(DefenseRequestObserver::class);
    }
}

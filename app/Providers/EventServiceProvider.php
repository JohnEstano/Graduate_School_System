<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

use App\Models\DefenseRequest;
use App\Observers\DefenseRequestObserver;



class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        'App\Events\SomeEvent' => [
            'App\Listeners\SomeListener',
        ],
    ];

    /**
     * Register any event listener closures.
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();

        // register User observer to keep advisers in sync when users are created/updated
        \App\Models\User::observe(\App\Observers\UserObserver::class);


        // register DefenseRequest observer to keep advisers in sync when defense requests are created/updated
        DefenseRequest::observe(DefenseRequestObserver::class);

    }
}
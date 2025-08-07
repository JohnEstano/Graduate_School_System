<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use App\Models\Notification;

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
        Inertia::share([
            'notifications' => function () {
                if (Auth::check()) {
                    return Notification::where('user_id', Auth::id())
                        ->latest()->take(20)->get();
                }
                return [];
            },
            'unreadCount' => function () {
                if (Auth::check()) {
                    return Notification::where('user_id', Auth::id())
                        ->where('read', false)->count();
                }
                return 0;
            }
        ]);
    }
}

<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Observers\DefenseRequestObserver;
use App\Observers\AaPaymentVerificationObserver;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use App\Models\Notification;
use Carbon\Carbon;


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

        // Register observers
        DefenseRequest::observe(DefenseRequestObserver::class);
        AaPaymentVerification::observe(AaPaymentVerificationObserver::class);

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
            },
            'auth' => function () {
                $user = Auth::user();
                return [
                    'user' => $user,
                    'is_adviser' => $user ? $user->isActiveAdviser() : false,
                ];
            },
        ]);

        Carbon::serializeUsing(fn ($c) => $c->timezone(config('app.timezone'))->toIso8601String()); // e.g., 2025-10-30T14:05:00+08:00

    }
}

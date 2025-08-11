<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
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
        // Optimize Inertia sharing with lazy loading and error handling
        Inertia::share([
            'notifications' => function () {
                if (!Auth::check()) {
                    return [];
                }
                
                try {
                    // Cache notifications for 5 minutes to improve performance
                    $cacheKey = 'user_notifications_' . Auth::id();
                    return cache()->remember($cacheKey, now()->addMinutes(5), function () {
                        return Notification::where('user_id', Auth::id())
                            ->select('id', 'type', 'title', 'message', 'link', 'read', 'created_at')
                            ->latest()
                            ->take(20)
                            ->get();
                    });
                } catch (\Exception $e) {
                    // Log error and return empty array if notifications table doesn't exist
                    Log::warning('Notifications table not available: ' . $e->getMessage());
                    return [];
                }
            },
            'unreadCount' => function () {
                if (!Auth::check()) {
                    return 0;
                }
                
                try {
                    // Cache unread count for 2 minutes
                    $cacheKey = 'user_unread_count_' . Auth::id();
                    return cache()->remember($cacheKey, now()->addMinutes(2), function () {
                        return Notification::where('user_id', Auth::id())
                            ->where('read', false)
                            ->count();
                    });
                } catch (\Exception $e) {
                    return 0;
                }
            }
        ]);
    }
}

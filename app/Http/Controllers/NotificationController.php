<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()->get();

        return Inertia::render('notification/Index', [
            'notifications' => $notifications
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $notification->update(['read' => true]);
        if ($request->expectsJson()) {
            return response()->json(['success' => true]);
        }
        return back();
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);
        return redirect()->back()->with('success', 'All notifications marked as read!');
    }
}

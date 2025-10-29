<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Services\UicApiClient;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // Regenerate CSRF token to ensure fresh token on login page
        $request->session()->regenerateToken();
        
        return Inertia::render('auth/login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        // Update adviser status if matching adviser exists
        $user = Auth::user();
        if ($user) {
            $adviser = \App\Models\Adviser::where('email', $user->email)->first();
            if ($adviser) {
                $adviser->status = 'active';
                $adviser->user_id = $user->id;
                $adviser->save();
            }
            
            // Check if this user has any pending student assignments (pre-registered)
            // Handle both full email (e.g., gdiapana_230000001047@uic.edu.ph) and variations
            $pendingAssignments = \App\Models\PendingStudentAssignment::where(function($query) use ($user) {
                $query->where('student_email', $user->email);
                
                // If user has a student_number, also check for email patterns with student number
                if ($user->student_number) {
                    $query->orWhere('student_email', 'LIKE', '%' . $user->student_number . '%@uic.edu.ph');
                }
                
                // Also check if email starts with any part of user's name + student_number
                if ($user->email) {
                    // Extract student ID from email (e.g., 230000001047 from gdiapana_230000001047@uic.edu.ph)
                    if (preg_match('/(\d{10,})/', $user->email, $matches)) {
                        $studentId = $matches[1];
                        $query->orWhere('student_email', 'LIKE', '%' . $studentId . '%@uic.edu.ph');
                    }
                }
            })->get();
            
            if ($pendingAssignments->isNotEmpty()) {
                foreach ($pendingAssignments as $pending) {
                    try {
                        // Get the adviser for this assignment
                        $adviserForAssignment = \App\Models\Adviser::find($pending->adviser_id);
                        
                        if ($adviserForAssignment && $adviserForAssignment->user_id) {
                            // Check if assignment already exists
                            $exists = DB::table('adviser_student')
                                ->where('adviser_id', $adviserForAssignment->user_id)
                                ->where('student_id', $user->id)
                                ->exists();
                            
                            if (!$exists) {
                                // Create the assignment with pending status (adviser needs to accept)
                                DB::table('adviser_student')->insert([
                                    'adviser_id' => $adviserForAssignment->user_id,
                                    'student_id' => $user->id,
                                    'status' => 'pending',
                                    'requested_by' => $pending->coordinator_id,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                
                                // Create notification for adviser
                                $coordinator = \App\Models\User::find($pending->coordinator_id);
                                $adviserUser = \App\Models\User::find($adviserForAssignment->user_id);
                                
                                if ($adviserUser && $coordinator) {
                                    \App\Models\Notification::create([
                                        'user_id' => $adviserUser->id,
                                        'type' => 'student_assigned',
                                        'title' => 'New Student Assigned',
                                        'message' => "Coordinator {$coordinator->first_name} {$coordinator->last_name} has assigned {$user->first_name} {$user->last_name} to you. Please review and accept/reject.",
                                        'action_url' => '/adviser/pending-students',
                                    ]);
                                    
                                    // Queue email notification to adviser (with rate limiting)
                                    try {
                                        Mail::to($adviserUser->email)->queue(
                                            new \App\Mail\StudentRegisteredNotification(
                                                $adviserUser, 
                                                $user, 
                                                $coordinator,
                                                $pending->student_email  // Pass original email from pending assignment
                                            )
                                        );
                                        
                                        Log::info('Student registration notification queued for adviser', [
                                            'adviser_email' => $adviserUser->email,
                                            'student_name' => "{$user->first_name} {$user->last_name}",
                                            'student_email' => $pending->student_email,
                                            'coordinator_name' => "{$coordinator->first_name} {$coordinator->last_name}",
                                        ]);
                                    } catch (\Exception $e) {
                                        Log::error('Failed to send student registration notification to adviser', [
                                            'adviser_email' => $adviserUser->email,
                                            'student_id' => $user->id,
                                            'error' => $e->getMessage()
                                        ]);
                                        // Don't fail the login process if email fails
                                    }
                                }
                                
                                // Create notification for student
                                \App\Models\Notification::create([
                                    'user_id' => $user->id,
                                    'type' => 'assigned_to_adviser',
                                    'title' => 'Assigned to Adviser',
                                    'message' => "You have been assigned to an adviser. Awaiting adviser's acceptance.",
                                    'action_url' => '/dashboard',
                                ]);
                                
                                Log::info('Pre-registered student assignment activated', [
                                    'student_id' => $user->id,
                                    'student_email' => $user->email,
                                    'adviser_id' => $adviserForAssignment->user_id,
                                    'pending_assignment_id' => $pending->id
                                ]);
                            }
                        }
                        
                        // Delete the pending assignment record
                        $pending->delete();
                        
                    } catch (\Exception $e) {
                        Log::error('Failed to process pending student assignment', [
                            'student_email' => $user->email,
                            'pending_id' => $pending->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Show the local login page.
     */
    public function createLocal(Request $request): Response
    {
        // Regenerate CSRF token to ensure fresh token on login page
        $request->session()->regenerateToken();
        
        return Inertia::render('auth/login-local', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle local authentication request (no API, direct database check).
     */
    public function storeLocal(Request $request): RedirectResponse
    {
        // Validate input
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        $identifier = $request->input('identifier');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // Find user by email or student_number
        $user = User::where('email', $identifier)
            ->orWhere('student_number', $identifier)
            ->first();

        // Check if user exists and password matches
        if (!$user || !Hash::check($password, $user->password)) {
            return back()->withErrors([
                'identifier' => 'The provided credentials do not match our records.',
            ])->onlyInput('identifier');
        }

        // Log the user in
        Auth::login($user, $remember);
        $request->session()->regenerate();

        // Update adviser status if matching adviser exists
        if ($user) {
            $adviser = \App\Models\Adviser::where('email', $user->email)->first();
            if ($adviser) {
                $adviser->status = 'active';
                $adviser->user_id = $user->id;
                $adviser->save();
            }
            
            // Handle pending student assignments (same logic as API login)
            $pendingAssignments = \App\Models\PendingStudentAssignment::where(function($query) use ($user) {
                $query->where('student_email', $user->email);
                
                if ($user->student_number) {
                    $query->orWhere('student_email', 'LIKE', '%' . $user->student_number . '%@uic.edu.ph');
                }
                
                if ($user->email) {
                    if (preg_match('/(\d{10,})/', $user->email, $matches)) {
                        $studentId = $matches[1];
                        $query->orWhere('student_email', 'LIKE', '%' . $studentId . '%@uic.edu.ph');
                    }
                }
            })->get();
            
            if ($pendingAssignments->isNotEmpty()) {
                foreach ($pendingAssignments as $pending) {
                    try {
                        $adviserForAssignment = \App\Models\Adviser::find($pending->adviser_id);
                        
                        if ($adviserForAssignment && $adviserForAssignment->user_id) {
                            $exists = DB::table('adviser_student')
                                ->where('adviser_id', $adviserForAssignment->user_id)
                                ->where('student_id', $user->id)
                                ->exists();
                            
                            if (!$exists) {
                                DB::table('adviser_student')->insert([
                                    'adviser_id' => $adviserForAssignment->user_id,
                                    'student_id' => $user->id,
                                    'status' => 'pending',
                                    'requested_by' => $pending->coordinator_id,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                
                                $coordinator = \App\Models\User::find($pending->coordinator_id);
                                $adviserUser = \App\Models\User::find($adviserForAssignment->user_id);
                                
                                if ($adviserUser && $coordinator) {
                                    \App\Models\Notification::create([
                                        'user_id' => $adviserUser->id,
                                        'type' => 'student_assigned',
                                        'title' => 'New Student Assigned',
                                        'message' => "Coordinator {$coordinator->first_name} {$coordinator->last_name} has assigned {$user->first_name} {$user->last_name} to you. Please review and accept/reject.",
                                        'action_url' => '/adviser/pending-students',
                                    ]);
                                    
                                    // Queue email notification to adviser (with rate limiting)
                                    try {
                                        Mail::to($adviserUser->email)->queue(
                                            new \App\Mail\StudentRegisteredNotification(
                                                $adviserUser, 
                                                $user, 
                                                $coordinator,
                                                $pending->student_email  // Pass original email from pending assignment
                                            )
                                        );
                                        
                                        Log::info('Student registration notification queued for adviser (local login)', [
                                            'adviser_email' => $adviserUser->email,
                                            'student_name' => "{$user->first_name} {$user->last_name}",
                                            'student_email' => $pending->student_email,
                                            'coordinator_name' => "{$coordinator->first_name} {$coordinator->last_name}",
                                        ]);
                                    } catch (\Exception $e) {
                                        Log::error('Failed to queue student registration notification to adviser (local login)', [
                                            'adviser_email' => $adviserUser->email,
                                            'student_id' => $user->id,
                                            'error' => $e->getMessage()
                                        ]);
                                        // Don't fail the login process if email fails
                                    }
                                }
                                
                                \App\Models\Notification::create([
                                    'user_id' => $user->id,
                                    'type' => 'assigned_to_adviser',
                                    'title' => 'Assigned to Adviser',
                                    'message' => "You have been assigned to an adviser. Awaiting adviser's acceptance.",
                                    'action_url' => '/dashboard',
                                ]);
                                
                                Log::info('Pre-registered student assignment activated (local login)', [
                                    'student_id' => $user->id,
                                    'student_email' => $user->email,
                                    'adviser_id' => $adviserForAssignment->user_id,
                                    'pending_assignment_id' => $pending->id
                                ]);
                            }
                        }
                        
                        $pending->delete();
                        
                    } catch (\Exception $e) {
                        Log::error('Failed to process pending student assignment (local login)', [
                            'student_email' => $user->email,
                            'pending_id' => $pending->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
        }

        Log::info('User logged in successfully (local)', [
            'user_id' => $user->id,
            'email' => $user->email,
            'login_method' => 'local'
        ]);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Clear UIC API bearer token if user exists
        if ($user) {
            try {
                $uicApi = app(UicApiClient::class);
                $uicApi->clearCachedToken($user->id);
            } catch (\Throwable $e) {
                // Log but don't fail logout
                Log::error('Failed to clear UIC API token on logout', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to login page instead of home to avoid CSRF issues
        return redirect()->route('login');
    }
}

<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // If student, include adviser info
        $advisers = [];
        if ($user->role === 'Student') {
            $advisers = $user->advisers()
                ->select('first_name', 'last_name', 'email')
                ->get()
                ->map(function ($a) {
                    return [
                        'name' => trim($a->first_name . ' ' . $a->last_name),
                        'email' => $a->email,
                    ];
                });
        }

        // If adviser/faculty, include coordinator info
        $coordinators = [];
        if (in_array($user->role, ['Adviser', 'Faculty'])) {
            $coordinators = $user->coordinators()
                ->select('first_name', 'middle_name', 'last_name', 'email')
                ->get()
                ->map(function ($c) {
                    return [
                        'name' => trim($c->first_name . ' ' . ($c->middle_name ? strtoupper($c->middle_name[0]) . '. ' : '') . $c->last_name),
                        'email' => $c->email,
                    ];
                });
        }

        // For Adviser/Faculty, ensure adviser_code is generated and returned
        $adviserCode = null;
        if (in_array($user->role, ['Adviser', 'Faculty'])) {
            if (!$user->adviser_code) {
                $user->generateAdviserCode();
                $user->refresh();
            }
            $adviserCode = $user->adviser_code;
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'auth' => [
                'user' => array_merge(
                    $user->toArray(),
                    [
                        'advisers' => $advisers,
                        'adviser_code' => $adviserCode,
                        'coordinators' => $coordinators, // <-- ADD THIS LINE
                    ]
                ),
            ],
        ]);
    }

    /**
     * Update the user's profile settings.
     */
 public function update(ProfileUpdateRequest $request): RedirectResponse
{
    // 1) Pull in the validated data
    $data = $request->validated(); // ['name' => 'Test User', 'email' => 'test@example.com']

    // 2) Split the full “name” into parts
    $parts = preg_split('/\s+/', trim($data['name']));
    $last  = array_pop($parts);
    $firstAndMiddle = implode(' ', $parts);

    // 3) Build an array matching your columns
    $attrs = [
        'first_name'  => Str::before($firstAndMiddle, ' ') ?: $firstAndMiddle,
        'middle_name' => Str::contains($firstAndMiddle, ' ')
                            ? Str::after($firstAndMiddle, ' ')
                            : null,
        'last_name'   => $last,
        'email'       => $data['email'],
    ];

    // 4) Fill & save the user
    $user = $request->user();
    $user->fill($attrs);

    // 5) If their email changed, clear verification
    if ($user->isDirty('email')) {
        $user->email_verified_at = null;
    }

    $user->save();

    return to_route('profile.edit');
}

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

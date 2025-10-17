<?php


namespace App\Observers;

use App\Models\User;
use App\Models\Adviser;

class UserObserver
{
    public function created(User $user)
    {
        $this->syncAdviserWithUser($user);
    }

    public function updated(User $user)
    {
        // only proceed when relevant fields changed
        if ($user->wasChanged(['email', 'role', 'first_name', 'middle_name', 'last_name', 'employee_id'])) {
            $this->syncAdviserWithUser($user);
        }
    }

    protected function syncAdviserWithUser(User $user): void
    {
        // Only sync for adviser/faculty roles
        if (! in_array($user->role, ['Adviser', 'Faculty'])) {
            return;
        }

        Adviser::where('email', $user->email)
            ->update([
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'employee_id' => $user->employee_id ?? null,
                // ensure we use allowed enum values: 'active' or 'pending'
                'status' => 'active',
            ]);
    }
}
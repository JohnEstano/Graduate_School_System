<?php

namespace App\Http\Controllers;

use App\Http\Requests\LinkLegacyRequest;
use App\Models\LegacyCredential;
use App\Models\LegacyRecordCache;
use App\Services\LegacyPortalClient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LegacyLinkController extends Controller
{
    public function form(): Response
    {
    $cred = LegacyCredential::where('user_id', Auth::id())->first();
        return Inertia::render('legacy/LinkLegacy', [
            'linked' => (bool)$cred,
            'status' => $cred?->status,
            'lastValidatedAt' => $cred?->last_validated_at,
            'lastError' => $cred?->last_error,
        ]);
    }

    public function link(LinkLegacyRequest $request, LegacyPortalClient $client): RedirectResponse
    {
        $username = $request->input('legacy_username');
        $password = $request->input('legacy_password');

        try {
            $session = $client->login($username, $password);
            LegacyCredential::updateOrCreate(
                ['user_id' => Auth::id()],
                [
                    'legacy_username' => $username,
                    'encrypted_password' => encrypt($password),
                    'last_validated_at' => now(),
                    'status' => 'valid',
                    'last_error' => null,
                ]
            );
            $client->recordAudit(Auth::id(), 'link_legacy');
            return redirect()->route('legacy.link.form')->with('status', 'Linked successfully. Initial sync pending.');
        } catch (Throwable $e) {
            $client->recordAudit(Auth::id(), 'link_legacy', 'error', ['message' => $e->getMessage()]);
            return back()->withErrors(['legacy_username' => 'Legacy login failed.'])->withInput();
        }
    }

    public function unlink(): RedirectResponse
    {
    LegacyCredential::where('user_id', Auth::id())->delete();
    LegacyRecordCache::where('user_id', Auth::id())->delete();
        return redirect()->route('legacy.link.form')->with('status', 'Legacy account unlinked.');
    }
}

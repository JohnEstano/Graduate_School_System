<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class LinkLegacyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'legacy_username' => ['required','string','max:50'],
            'legacy_password' => ['required','string','max:100'],
        ];
    }
}

import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    identifier: string; // email or student number
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    googleJustVerified?: boolean;
    googleSuccessMessage?: string;
    googleVerifiedEmail?: string;
    googleSuggestedIdentifier?: string;
}

export default function Login(props: LoginProps) {
    const { status, canResetPassword, googleJustVerified, googleSuccessMessage, googleVerifiedEmail, googleSuggestedIdentifier } = props;
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        identifier: '',
        password: '',
        remember: false,
    });
    const [showBlockNotice, setShowBlockNotice] = useState(false);
    const [googleVerified, setGoogleVerified] = useState<boolean>(!!googleJustVerified);
    const [checking, setChecking] = useState(false);

    // Separate form state for fallback login
    const [fallbackData, setFallbackData] = useState({
        identifier: '',
        password: '',
        remember: false,
    });
    const [fallbackProcessing, setFallbackProcessing] = useState(false);
    const [fallbackError, setFallbackError] = useState<string | null>(null);

    // On mount after Google verification, prefill identifier if suggested.
    useEffect(() => {
        if (googleJustVerified && googleSuggestedIdentifier && !data.identifier) {
            setData('identifier', googleSuggestedIdentifier);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check verification status when identifier looks like student number or institutional email
    useEffect(() => {
        // If we just returned from Google, keep fields enabled regardless of identifier until user changes it.
        if (googleJustVerified) {
            return; // skip auto-check until user enters identifier
        }
        const id = data.identifier.trim();
        if (!id) { setGoogleVerified(false); return; }
        const isNumeric = /^[0-9]{6,}$/.test(id);
        const isEmail = /@/.test(id);
        if (!(isNumeric || isEmail)) { setGoogleVerified(false); return; }
        let active = true;
        setChecking(true);
        fetch(`/auth/status/google-verified?identifier=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(j => { if (active) setGoogleVerified(!!j.verified); })
            .catch(() => { if (active) setGoogleVerified(false); })
            .finally(() => { if (active) setChecking(false); });
        return () => { active = false; };
    }, [data.identifier]);

    // Detect the specific Google verification enforcement message
    useEffect(() => {
        if (errors.identifier && /sign in with Google/i.test(errors.identifier)) {
            setShowBlockNotice(true);
        }
    }, [errors.identifier]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onSuccess: () => {
                // Inertia will handle redirect (e.g., to dashboard) without full reload.
                reset('password');
            },
            onError: () => {
                // Password cleared only on failure for security.
                reset('password');
            },
        });
    };

    // Fallback login handler
    const handleFallbackLogin: FormEventHandler = (e) => {
        e.preventDefault();
        setFallbackProcessing(true);
        setFallbackError(null);
        fetch('/login-registered', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify(fallbackData),
        })
            .then(async res => {
                if (res.redirected) {
                    window.location.href = res.url;
                } else if (!res.ok) {
                    const data = await res.json();
                    setFallbackError(data.errors?.identifier || data.message || 'Login failed.');
                }
            })
            .catch(() => setFallbackError('Network error.'))
            .finally(() => setFallbackProcessing(false));
    };

    return (
        <AuthLayout title="Graduate School System" description="Login to your UIC account">
            <Head title="Log in" />

            {/* Success banner after Google verification */}
            {googleJustVerified && googleSuccessMessage && (
                <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
                    <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-green-300 bg-green-50 shadow-lg ring-1 ring-green-200">
                        <div className="flex items-start gap-3 p-4 pr-4">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            </div>
                            <div className="text-sm text-green-800">
                                <p className="font-semibold">Google Verified</p>
                                <p className="mt-1 leading-snug">{googleSuccessMessage}</p>
                                {googleVerifiedEmail && (
                                    <p className="mt-1 text-xs text-green-600">Email: {googleVerifiedEmail}</p>
                                )}
                                <p className="mt-2 text-xs text-green-700">Enter your student number and password below.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating alert for Google verification requirement */}
            {showBlockNotice && (
                <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
                    <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-red-300 bg-red-50 shadow-lg ring-1 ring-red-200">
                        <button
                            type="button"
                            onClick={() => setShowBlockNotice(false)}
                            className="absolute right-2 top-2 rounded p-1 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label="Dismiss notice"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <div className="flex items-start gap-3 p-4 pr-8">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <div className="text-sm text-red-800">
                                <p className="font-semibold">Google Verification Required</p>
                                <p className="mt-1 leading-snug">{errors.identifier}</p>
                                <p className="mt-2 text-xs text-red-600">Click "Sign in with Google" below using your @uic.edu.ph email once. After that you can use your student number directly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={submit} aria-describedby={showBlockNotice ? 'google-block-notice' : undefined}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email or Student Number</Label>
                        <p className="text-[10px] text-slate-500 -mt-1">First time? Use Google (@uic.edu.ph) sign-in before student number login.</p>
                        <Input
                            id="identifier"
                            name="identifier"
                            type="text"
                            required
                            autoComplete="username"
                            value={data.identifier}
                            onChange={e => setData('identifier', e.target.value)}
                            placeholder="Email or Student Number"
                            className={!googleVerified && /@/.test(data.identifier) ? 'opacity-60' : ''}
                            disabled={!googleJustVerified && /@/.test(data.identifier)}
                        />
                        {/@/.test(data.identifier) && (
                            <p className="text-[11px] text-blue-600 mt-1">Use the Google button below to continue with your email.</p>
                        )}
                        <InputError message={errors.identifier} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            disabled={!googleVerified}
                        />
                        {!googleVerified && data.identifier && (
                            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {checking ? 'Checking Google verification…' : 'Complete Google sign-in first.'}
                            </p>
                        )}
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing || !googleVerified}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {googleVerified ? 'Log in' : 'Log in (Google verify first)'}
                    </Button>
                </div>
            </form>

            {/* --- Google Login Section --- */}
            <div className="mb-8">
                <h2 className="text-base font-semibold mb-2">Login with Google (@uic.edu.ph)</h2>
                <a
                    href={route('google.redirect')}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-500 bg-white py-2 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 dark:border-blue-400 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3h8.5c-.3 2-2.3 6-8.5 6-5.2 0-9.5-4.3-9.5-9.5S6.8 1 12 1c3 0 5 1.3 6.2 2.5L20.5 1C18.3-.9 15.4-1 12-1 5.4-1 0 4.4 0 11s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.5 0-.8-.1-1.4-.2-2.1H12Z" /><path fill="#34A853" d="M1.7 6.7 4.9 9c1-2.4 3.3-4 6.1-4 1.8 0 3.4.6 4.6 1.7l3.4-3.4C16.9 1.1 14.6 0 11 0 6.4 0 2.5 2.6 1 6.2l.7.5Z" /><path fill="#FBBC05" d="M12 24c3.2 0 6.2-1.1 8.4-3.1l-3.9-3.2c-1.1.8-2.5 1.3-4.5 1.3-3.5 0-6.4-2.4-7.4-5.6l-3.8 2.9C2.3 21.4 6.8 24 12 24Z" /><path fill="#4285F4" d="M23.8 10.4H12v4.4h6.8c-.5 1.6-1.5 2.8-3 3.6l3.9 3.1c-2.3 2.1-5.3 3.3-8.7 3.3-5.2 0-9.7-2.6-11.4-7l3.8-2.9c.8 2.4 3.3 4.3 6.6 4.3 1.9 0 3.5-.6 4.5-1.3.8-.5 1.4-1.2 1.8-2.1.4-.9.6-1.8.6-2.7 0-.9-.2-1.7-.4-2.4Z" /></svg>
                    <span>Sign in with Google</span>
                </a>
                <p className="text-center text-[11px] text-slate-500 dark:text-neutral-500 mt-2">Only @uic.edu.ph accounts are accepted.</p>
            </div>

            {/* --- Divider --- */}
            <div className="relative flex items-center justify-center my-6">
                <span className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-neutral-700" />
                <span className="absolute bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">or</span>
            </div>

            {/* --- Registered Account Login Section --- */}
            <div>
                <h2 className="text-base font-semibold mb-2">Login with Registered Account</h2>
                <form className="flex flex-col gap-4" onSubmit={handleFallbackLogin}>
                    <div>
                        <Label htmlFor="fallback-identifier">Email or Student Number</Label>
                        <Input
                            id="fallback-identifier"
                            type="text"
                            required
                            autoComplete="username"
                            value={fallbackData.identifier}
                            onChange={e => setFallbackData({ ...fallbackData, identifier: e.target.value })}
                            placeholder="Username"
                        />
                    </div>
                    <div>
                        <Label htmlFor="fallback-password">Password</Label>
                        <Input
                            id="fallback-password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={fallbackData.password}
                            onChange={e => setFallbackData({ ...fallbackData, password: e.target.value })}
                            placeholder="Password"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="fallback-remember"
                            name="fallback-remember"
                            checked={fallbackData.remember}
                            onClick={() => setFallbackData({ ...fallbackData, remember: !fallbackData.remember })}
                        />
                        <Label htmlFor="fallback-remember">Remember me</Label>
                    </div>
                    {fallbackError && (
                        <div className="text-xs text-red-600">{fallbackError}</div>
                    )}
                    <Button type="submit" className="mt-2 w-full" disabled={fallbackProcessing}>
                        {fallbackProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Log in'}
                    </Button>
                </form>
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}

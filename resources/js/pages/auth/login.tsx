import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

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
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        identifier: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => {
                reset('password');
                if (Object.keys(errors).length === 0) {
                    window.location.reload(); 
                }
            },
        });
    };

    return (
        <AuthLayout title="Graduate School System" description="Login to your UIC account">
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email or Student Number</Label>
                        <Input
                            id="identifier"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="username"
                            value={data.identifier}
                            onChange={(e) => setData('identifier', e.target.value)}
                            placeholder="Username"
                        />
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
                        />
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

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>
            </form>

            <div className="mt-8 space-y-4">
                <div className="relative flex items-center justify-center">
                    <span className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-neutral-700" />
                    <span className="absolute bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">or</span>
                </div>
                <a
                    href={route('google.redirect')}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3h8.5c-.3 2-2.3 6-8.5 6-5.2 0-9.5-4.3-9.5-9.5S6.8 1 12 1c3 0 5 1.3 6.2 2.5L20.5 1C18.3-.9 15.4-1 12-1 5.4-1 0 4.4 0 11s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.5 0-.8-.1-1.4-.2-2.1H12Z" /><path fill="#34A853" d="M1.7 6.7 4.9 9c1-2.4 3.3-4 6.1-4 1.8 0 3.4.6 4.6 1.7l3.4-3.4C16.9 1.1 14.6 0 11 0 6.4 0 2.5 2.6 1 6.2l.7.5Z" /><path fill="#FBBC05" d="M12 24c3.2 0 6.2-1.1 8.4-3.1l-3.9-3.2c-1.1.8-2.5 1.3-4.5 1.3-3.5 0-6.4-2.4-7.4-5.6l-3.8 2.9C2.3 21.4 6.8 24 12 24Z" /><path fill="#4285F4" d="M23.8 10.4H12v4.4h6.8c-.5 1.6-1.5 2.8-3 3.6l3.9 3.1c-2.3 2.1-5.3 3.3-8.7 3.3-5.2 0-9.7-2.6-11.4-7l3.8-2.9c.8 2.4 3.3 4.3 6.6 4.3 1.9 0 3.5-.6 4.5-1.3.8-.5 1.4-1.2 1.8-2.1.4-.9.6-1.8.6-2.7 0-.9-.2-1.7-.4-2.4Z" /></svg>
                    <span>Sign in with Google</span>
                </a>
                <p className="text-center text-[11px] text-slate-500 dark:text-neutral-500">Only @uic.edu.ph accounts are accepted.</p>
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}

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
    mode?: 'auto' | 'local' | 'api';
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login(props: LoginProps) {
    const { status, canResetPassword } = props;
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        identifier: '',
        password: '',
        remember: false,
        mode: 'auto',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Use the unified auth endpoint which supports modes: auto | local | api
        // This fixes local login by avoiding the API-only route when not needed
        post(route('login'), {
            onSuccess: () => {
                reset('password');
            },
            onError: () => {
                reset('password');
            },
        });
    };

    return (
        <AuthLayout title="Graduate School System" description="Login to your UIC account">
            <Head title="Log in" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    {/* Login method selector */}
                    <div className="grid gap-2">
                        <Label htmlFor="mode">Login method</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['auto','local','api'] as const).map((opt) => (
                                <Button
                                    key={opt}
                                    type="button"
                                    variant={data.mode === opt ? 'default' : 'outline'}
                                    className="h-9"
                                    onClick={() => setData('mode', opt)}
                                    aria-pressed={data.mode === opt}
                                >
                                    {opt === 'auto' ? 'Auto' : opt.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Auto tries Local first, then API. Choose Local to bypass the API when it’s down.
                        </div>
                        <InputError message={errors.mode as any} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email or Student Number</Label>
                        <Input
                            id="identifier"
                            name="identifier"
                            type="text"
                            required
                            autoComplete="username"
                            value={data.identifier}
                            onChange={e => setData('identifier', e.target.value)}
                            placeholder="Use your myuic credentials"
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
        </AuthLayout>
    );
}

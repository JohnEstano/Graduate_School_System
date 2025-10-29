import { Head, useForm, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    identifier: string; // email or student number
    password: string;
    remember: boolean;
    mode: 'local';
};

interface LoginProps {
    status?: string;
}

export default function LoginLocal(props: LoginProps) {
    const { status } = props;
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        identifier: '',
        password: '',
        remember: false,
        mode: 'local',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Local login mode
        post(route('login.local.submit'), {
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
            <Head title="Log in - Local" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
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
                        <Label htmlFor="password">Password</Label>
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

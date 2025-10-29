import { Head, useForm, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    identifier: string; // email or student number
    password: string;
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
        mode: 'local',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Local login mode
        post(route('login.local.submit'), {
            preserveState: true,  // Keep state to show errors
            preserveScroll: true,
            onSuccess: () => {
                reset('password');
            },
            onError: (errors) => {
                reset('password');
                console.log('Login errors:', errors);
            },
        });
    };

    return (
        <AuthLayout title="Graduate School System" description="Login to your UIC account">
            <Head title="Log in - Local" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
            
            {/* Display error message if login fails */}
            {(errors.identifier || errors.password) && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {errors.identifier || errors.password}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                            tabIndex={1}
                            value={data.identifier}
                            onChange={e => setData('identifier', e.target.value)}
                            placeholder="Use your myuic credentials"
                            className={errors.identifier ? 'border-red-500' : ''}
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
                            className={errors.password ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={3} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}

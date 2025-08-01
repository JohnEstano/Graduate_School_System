import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    program: string;
    school_id: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'Student',
        program: '',
        school_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account (For Development only)" description="Enter your details below to create your account">
            <Head title="Register" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="first_name">Firstname</Label>
                        <Input
                            id="first_name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="firstname"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            disabled={processing}
                            placeholder="Firstname"
                        />
                        <InputError message={errors.first_name} />
                        <Label htmlFor="middle_name">Middle name</Label>
                        <Input
                            id="middle_name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="middle"
                            value={data.middle_name}
                            onChange={(e) => setData('middle_name', e.target.value)}
                            disabled={processing}
                            placeholder="Middle Name"
                        />
                        <InputError message={errors.middle_name} />
                        <Label htmlFor="last_name">Lastname</Label>
                        <Input
                            id="last_name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="lastname"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            disabled={processing}
                            placeholder="Lastname"
                        />
                        <InputError message={errors.last_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />

                        <Label htmlFor="school_id">School ID</Label>
                        <Input
                            id="school_id"
                            type="text"
                            required
                            tabIndex={2}
                            autoComplete="00000"
                            value={data.school_id}
                            onChange={(e) => setData('school_id', e.target.value)}
                            disabled={processing}
                            placeholder="230000001603"
                        />
                        <InputError message={errors.school_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            required
                            tabIndex={5}
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            disabled={processing}
                            className="rounded border px-3 py-2"
                        >
                            <option value="Student">Student</option>
                            <option value="Administrative Assistant">Administrative Assistant</option>
                            <option value="Coordinator">Coordinator</option>
                            <option value="Dean">Dean</option>
                        </select>
                        <InputError message={errors.role} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="program">Program (if applicable)</Label>
                        <Select value={data.program} onValueChange={(value) => setData('program', value)} disabled={processing}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select your program" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-auto">
                                <SelectGroup>
                                    <SelectItem value="Master of Arts in Education major in English">
                                        Master of Arts in Education major in English
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Sociology">
                                        Master of Arts in Education major in Sociology
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Mathematics">
                                        Master of Arts in Education major in Mathematics
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Physical Education">
                                        Master of Arts in Education major in Physical Education
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Educational Management">Master of Arts in Educational Management</SelectItem>
                                    <SelectItem value="Master of Arts in Elementary Education">Master of Arts in Elementary Education</SelectItem>
                                    <SelectItem value="Master of Arts in Teaching College Chemistry">
                                        Master of Arts in Teaching College Chemistry
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Teaching College Physics">
                                        Master of Arts in Teaching College Physics
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Engineering Education with majors in Civil Engineering">
                                        Master of Arts in Engineering Education with majors in Civil Engineering
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Engineering Education with majors in Electronics Communications Engineering">
                                        Master of Arts in Engineering Education with majors in Electronics Communications Engineering
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Values Education">Master of Arts in Values Education</SelectItem>
                                    <SelectItem value="Master in Business Administration">Master in Business Administration</SelectItem>
                                    <SelectItem value="Master of Information Technology">Master of Information Technology</SelectItem>
                                    <SelectItem value="Master in Information Systems">Master in Information Systems</SelectItem>
                                    <SelectItem value="Master of Science in Pharmacy">Master of Science in Pharmacy</SelectItem>
                                    <SelectItem value="Master of Science in Medical Technology/ Medical Laboratory Science">
                                        Master of Science in Medical Technology/ Medical Laboratory Science
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Filipino">
                                        Master of Arts in Education major in Filipino
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Music Education">
                                        Master of Arts in Education major in Music Education
                                    </SelectItem>
                                    <SelectItem value="Master of Arts in Education major in Information Technology Integration">
                                        Master of Arts in Education major in Information Technology Integration
                                    </SelectItem>
                                    <SelectItem value="Master in Counseling">Master in Counseling</SelectItem>
                                    <SelectItem value="Doctor in Business Management">Doctor in Business Management</SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Applied Linguistics">
                                        Doctor of Philosophy in Education major in Applied Linguistics
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Educational Leadership">
                                        Doctor of Philosophy in Education major in Educational Leadership
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Filipino">
                                        Doctor of Philosophy in Education major in Filipino
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Mathematics">
                                        Doctor of Philosophy in Education major in Mathematics
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Counseling">
                                        Doctor of Philosophy in Education major in Counseling
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Information Technology Integration">
                                        Doctor of Philosophy in Education major in Information Technology Integration
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Education major in Physical Education">
                                        Doctor of Philosophy in Education major in Physical Education
                                    </SelectItem>
                                    <SelectItem value="Doctor of Philosophy in Pharmacy">Doctor of Philosophy in Pharmacy</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.program} />
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={6} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={7}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}

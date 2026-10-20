import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

function getInitials(user: any) {
    const first = user.first_name?.trim()?.[0] ?? '';
    const last = user.last_name?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
}

function getFullName(user: any) {
    return (
        user.display_name ??
        user.name ??
        [user.first_name, user.middle_name ? `${user.middle_name[0].toUpperCase()}.` : '', user.last_name].filter(Boolean).join(' ')
    );
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    type Adviser = { name: string; email: string };
    const adviser: Adviser | null = Array.isArray(user.advisers) ? (user.advisers[0] ?? null) : null;
    const [adviserCode, setAdviserCode] = useState(user.adviser_code ?? '');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Coordinator registration for Adviser/Adviser ---
    const [coordinatorCode, setCoordinatorCode] = useState('');
    const [coordinatorRegisterLoading, setCoordinatorRegisterLoading] = useState(false);
    const [coordinatorError, setCoordinatorError] = useState('');
    // Always use { name, email } for coordinator state
    const [coordinator, setCoordinator] = useState(() => {
        const arr = Array.isArray(user.coordinators) ? user.coordinators : [];
        if (arr.length > 0) {
            const c = arr[0];
            return {
                name: c.name || [c.first_name, c.middle_name ? `${c.middle_name[0]}.` : '', c.last_name].filter(Boolean).join(' '),
                email: c.email,
            };
        }
        return null;
    });

    const handleRegisterCoordinator = async () => {
        setCoordinatorRegisterLoading(true);
        setCoordinatorError('');
        const toastId = toast.loading('Registering coordinator...');
        try {
            const res = await axios.post('/api/adviser/register-with-coordinator-code', { coordinator_code: coordinatorCode });
            toast.success('Coordinator registered successfully!', { id: toastId });
            if (res.data?.coordinator) {
                const c = res.data.coordinator;
                setCoordinator({
                    name: c.name || [c.first_name, c.middle_name ? `${c.middle_name[0]}.` : '', c.last_name].filter(Boolean).join(' '),
                    email: c.email,
                });
                setCoordinatorCode('');
            }
        } catch (e: any) {
            toast.dismiss(toastId);
            setCoordinatorError(e.response?.data?.error || 'Registration failed.');
        } finally {
            setCoordinatorRegisterLoading(false);
        }
    };

    const handleRegisterAdviser = async () => {
        setRegisterLoading(true);
        setError('');
        const toastId = toast.loading('Registering adviser...');
        try {
            const res = await axios.post('/api/adviser/register-with-code', { adviser_code: adviserCode });
            toast.success('Adviser registered successfully!', { id: toastId });
            window.location.reload();
        } catch (e: any) {
            toast.dismiss(toastId);
            setError(e.response?.data?.error || 'Registration failed.');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <Alert className="flex items-start gap-3 rounded-xl border-rose-200 bg-rose-50 px-6 py-5 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
                        <Info className="mt-1 h-5 w-5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
                        <div>
                            <AlertTitle className="mb-1 font-semibold">Notice</AlertTitle>
                            <AlertDescription>
                                Account details and information are fetched directly from the official myUIC portal database. Use the official myUIC
                                portal if you wish to change any of the user information.
                            </AlertDescription>
                        </div>
                    </Alert>
                    <div className="mb-8 flex flex-row items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-zinc-200 text-3xl font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                {getInitials(user)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-2xl font-semibold">{getFullName(user)}</div>
                            <div className="text-muted-foreground text-sm">{user.email}</div>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs">First Name</div>
                            <div className="text-base font-medium">{user.first_name}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs">Last Name</div>
                            <div className="text-base font-medium">{user.last_name}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs">School ID</div>
                            <div className="text-base font-medium">{user.school_id ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs">Role</div>
                            <div className="text-base font-medium">{user.role ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground mb-1 text-xs">Email</div>
                            <div className="text-base font-medium">{user.email ?? '—'}</div>
                        </div>
                        {user.program && (
                            <div>
                                <div className="text-muted-foreground mb-1 text-xs">Program</div>
                                <div className="text-base font-medium">{user.program}</div>
                            </div>
                        )}
                        {/* Show Adviser info for Students */}
                        {user.role === 'Student' && (
                            <div>
                                <div className="text-muted-foreground mb-1 text-xs">Adviser</div>
                                {adviser ? (
                                    <>
                                        <div className="text-base font-medium">{adviser.name}</div>
                                        <div className="text-muted-foreground mt-1 text-xs">{adviser.email}</div>
                                    </>
                                ) : (
                                    <div className="text-muted-foreground text-base">No adviser assigned.</div>
                                )}
                            </div>
                        )}
                        {(user.role === 'Adviser' || user.role === 'Adviser') && (
                            <>
                                <div>
                                    <div className="text-muted-foreground mb-1 text-xs">Adviser Code</div>
                                    <div className="text-base font-medium">{adviserCode ? String(adviserCode) : '—'}</div>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        Share this code with your students so they can register you as their adviser.
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1 text-xs">Coordinator</div>
                                    {coordinator ? (
                                        <>
                                            <div className="text-base font-medium">{coordinator.name}</div>
                                            <div className="text-muted-foreground mt-1 text-xs">{coordinator.email}</div>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground text-base">No coordinator assigned.</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="mt-6">
                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}
                    <div className="h-24" />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

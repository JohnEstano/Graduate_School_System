import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
    return user.display_name
        ?? user.name
        ?? [
            user.first_name,
            user.middle_name ? `${user.middle_name[0].toUpperCase()}.` : '',
            user.last_name
        ].filter(Boolean).join(' ');
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    type Adviser = { name: string; email: string };
    const adviser: Adviser | null = Array.isArray(user.advisers) ? user.advisers[0] ?? null : null;
    const [adviserCode, setAdviserCode] = useState(user.adviser_code ?? "");
    const [registerLoading, setRegisterLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Coordinator registration for Adviser/Faculty ---
    const [coordinatorCode, setCoordinatorCode] = useState("");
    const [coordinatorRegisterLoading, setCoordinatorRegisterLoading] = useState(false);
    const [coordinatorError, setCoordinatorError] = useState("");
    // Always use { name, email } for coordinator state
    const [coordinator, setCoordinator] = useState(() => {
        const arr = Array.isArray(user.coordinators) ? user.coordinators : [];
        if (arr.length > 0) {
            const c = arr[0];
            return {
                name: c.name
                    || [c.first_name, c.middle_name ? `${c.middle_name[0]}.` : '', c.last_name].filter(Boolean).join(' '),
                email: c.email,
            };
        }
        return null;
    });

    const handleRegisterCoordinator = async () => {
        setCoordinatorRegisterLoading(true);
        setCoordinatorError("");
        const toastId = toast.loading("Registering coordinator...");
        try {
            const res = await axios.post("/api/adviser/register-with-coordinator-code", { coordinator_code: coordinatorCode });
            toast.success("Coordinator registered successfully!", { id: toastId });
            if (res.data?.coordinator) {
                const c = res.data.coordinator;
                setCoordinator({
                    name: c.name
                        || [c.first_name, c.middle_name ? `${c.middle_name[0]}.` : '', c.last_name].filter(Boolean).join(' '),
                    email: c.email,
                });
                setCoordinatorCode("");
            }
        } catch (e: any) {
            toast.dismiss(toastId);
            setCoordinatorError(e.response?.data?.error || "Registration failed.");
        } finally {
            setCoordinatorRegisterLoading(false);
        }
    };

    const handleRegisterAdviser = async () => {
        setRegisterLoading(true);
        setError("");
        const toastId = toast.loading("Registering adviser...");
        try {
            const res = await axios.post("/api/adviser/register-with-code", { adviser_code: adviserCode });
            toast.success("Adviser registered successfully!", { id: toastId });
            window.location.reload();
        } catch (e: any) {
            toast.dismiss(toastId);
            setError(e.response?.data?.error || "Registration failed.");
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <Alert className="bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start gap-3 px-6 py-5 rounded-xl">
                        <Info className="h-5 w-5 text-rose-500 dark:text-rose-400 mt-1 flex-shrink-0" />
                        <div>
                            <AlertTitle className="font-semibold mb-1">Notice</AlertTitle>
                            <AlertDescription>
                                Account details and information are fetched directly from the official myUIC portal database. Use the official myUIC portal if you wish to change any of the user information.
                            </AlertDescription>
                        </div>
                    </Alert>
                    <div className="flex flex-row items-center gap-6 mb-8">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="text-3xl font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                                {getInitials(user)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-2xl font-semibold">
                                {getFullName(user)}
                            </div>
                            <div className="text-muted-foreground text-sm">{user.email}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-4">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">First Name</div>
                            <div className="font-medium text-base">{user.first_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Last Name</div>
                            <div className="font-medium text-base">{user.last_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">School ID</div>
                            <div className="font-medium text-base">{user.school_id ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Role</div>
                            <div className="font-medium text-base">{user.role ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Email</div>
                            <div className="font-medium text-base">{user.email ?? '—'}</div>
                        </div>
                        {user.program && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Program</div>
                                <div className="font-medium text-base">{user.program}</div>
                            </div>
                        )}
                        {/* Show Adviser info for Students */}
                        {user.role === "Student" && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Adviser</div>
                                {adviser ? (
                                    <>
                                        <div className="font-medium text-base">{adviser.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{adviser.email}</div>
                                    </>
                                ) : (
                                    <div className="text-base text-muted-foreground">No adviser assigned.</div>
                                )}
                            </div>
                        )}
                        {(user.role === "Adviser" || user.role === "Faculty") && (
                            <>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Adviser Code</div>
                                    <div className=" font-medium text-base">{adviserCode ? String(adviserCode) : "—"}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Share this code with your students so they can register you as their adviser.</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Coordinator</div>
                                    {coordinator ? (
                                        <>
                                            <div className="font-medium text-base">{coordinator.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{coordinator.email}</div>
                                        </>
                                    ) : (
                                        <div className="text-base text-muted-foreground">No coordinator assigned.</div>
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


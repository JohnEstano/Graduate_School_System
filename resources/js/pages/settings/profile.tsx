import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useState } from "react";

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
    // Use the display name from backend if available, else fallback
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
                                Account details is fetched directly from the{' '} myUIC portal. If you wish to change any user informations and details on your account, please do it on the official portal.
                            </AlertDescription>
                        </div>
                    </Alert>
                    <HeadingSmall title="Profile information" description="View your name, email, and school details" />
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
                            <div className="text-xs text-muted-foreground mb-1">Middle Name</div>
                            <div className="font-medium text-base">
                                {typeof user.middle_name === 'string' && user.middle_name.trim().length > 0
                                    ? user.middle_name
                                    : '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Last Name</div>
                            <div className="font-medium text-base">{user.last_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Email</div>
                            <div className="font-medium text-base">{user.email}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">School ID</div>
                            <div className="font-medium text-base">{user.school_id ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Program</div>
                            <div className="font-medium text-base">{user.program ?? '—'}</div>
                        </div>
                    </div>
                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="mt-6">
                            <p className="text-muted-foreground text-sm">
                                Your email address is unverified.&nbsp;
                            </p>
                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

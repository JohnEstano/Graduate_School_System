import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import DefenseStatusWidget from '../widgets/defense-status-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import ExamEligibilityWidget from '../widgets/exam-eligibility-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DefenseRequest } from '@/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import StatusDefenseWidget from '../widgets/status-defense-widget';

type DefenseRequirement = {
    id: number;
    thesis_title: string;
    status: string;
    created_at?: string;
};

type RecentPayment = {
    amount: number;
    // add other fields if needed
};

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
            school_id?: string;
            advisers?: any[]; // Add advisers property, adjust type if needed
        } | null;
    };
    defenseRequirement?: DefenseRequirement;
    defenseRequest?: DefenseRequest;
    defenseRequests?: DefenseRequest[];
    recentPayment?: RecentPayment;
};



export default function StudentDashboard() {
    const page = usePage<PageProps>().props;
    const { auth: { user }, defenseRequirement, defenseRequest } = page;
    const serverDefenseRequests = page.defenseRequests ?? [];

    const [allRequests, setAllRequests] = useState<DefenseRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<DefenseRequest[]>([]);
    const [todayEvents, setTodayEvents] = useState<DefenseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showAdviserAlert, setShowAdviserAlert] = useState(true);

    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

    const weekDays = [
        { label: 'Sun', value: 0 },
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 3 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 5 },
        { label: 'Sat', value: 6 },
    ];

    useEffect(() => {
        const hydrate = (requests: DefenseRequest[]) => {
            let mine = requests.filter(r => {
                const sb: any = (r as any).submitted_by;
                return sb === user?.id || sb === String(user?.id);
            });
            if (mine.length === 0) mine = requests;
            const sorted = [...mine].sort((a: any, b: any) => {
                const at = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bt - at;
            });
            setAllRequests(sorted);
        };

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch('/defense-request', { headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error('bad');
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.defenseRequests ?? []);
                hydrate(list);
            } catch (e) {
                setAllRequests([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.id]);

    const approvedDefenses = (serverDefenseRequests && serverDefenseRequests.length > 0) ? serverDefenseRequests : allRequests;

    // Example: Get most recent payment amount (replace with real data source)
    const recentPaymentAmount = page.recentPayment?.amount ?? 0; // If you have recentPayment in props

    // --- Student Metrics Cards ---
    const metrics = [
        {
            title: "Defense Submissions",
            value: allRequests.length,
            description: "Total defense requests submitted",
            icon: <ClipboardList className="size-7" />,
        },
        {
            title: "Today's Schedules",
            value: todayEvents.length,
            description: "Events scheduled for today",
            icon: <CalendarDays className="size-7" />,
        },
        {
            title: "Recent Payment",
            value: `₱${recentPaymentAmount.toLocaleString()}`,
            description: "Most recent payment made",
            icon: <BadgeDollarSign className="size-7" />,
        },
    ];

    // Remove the custom greeting to use the default time-based greeting
    // const customGreeting = user?.school_id ? `${user?.role ?? 'Student'} / ${user.school_id}` : (user?.role ?? 'Student');

    if (loading) {
        return (
            <UnifiedDashboardLayout user={user}>
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    <div className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    <div className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <div className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <div className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            </UnifiedDashboardLayout>
        );
    }

    return (
        <UnifiedDashboardLayout user={user}>
            {/* Quick Actions - positioned at top right */}
            <div className="absolute top-6 right-8">
                <QuickActionsWidget userRole={user?.role} />
            </div>

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 px-7 mb-6">
                        {/* Example metric cards */}
                        {metrics.map((metric, idx) => (
                            <Card key={idx} className="col-span-1 rounded-2xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
                                <div className="flex items-center justify-between px-6 pt-5">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {metric.title}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-sm font-semibold px-3 py-1"
                                        type="button"
                                    >
                                        View More
                                    </Button>
                                </div>
                                <div className="px-6">
                                    <div className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">{metric.value}</div>
                                    <div className="text-sm mt-1 mb-2 text-muted-foreground">{metric.description}</div>
                                </div>
                                <CardContent className="flex-1 flex items-end w-full p-0">
                                    <div className="flex items-center justify-end w-full pr-6 pb-4">
                                        {React.cloneElement(metric.icon, { className: "text-rose-500 dark:text-rose-400 size-7" })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {/* StatusDefenseWidget as a card */}
                        <StatusDefenseWidget recentRequests={allRequests} loading={loading} />
                    </div>

                    {/* ALERT: Student has not registered an adviser */}
                    {user?.advisers?.length === 0 && showAdviserAlert && (
                        <div className="mx-7 my-3">
                            <div className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start gap-3 px-6 py-5 rounded-xl relative">
                                <AlertCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="font-semibold mb-1 block">You have not registered an adviser yet.</span>
                                    <span className="text-sm">
                                        Please register with your adviser using their code or contact your adviser for assistance.
                                        <Link
                                            href="/settings/profile"
                                            className="ml-2 underline text-rose-600 dark:text-rose-300 font-medium hover:text-rose-700 dark:hover:text-rose-200"
                                        >
                                            Go to Settings
                                        </Link>
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowAdviserAlert(false)}
                                    className="absolute top-3 right-4 px-2 py-1 text-base rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-200"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Widgets Body */}
                    <div className="flex flex-col gap-6 bg-gray-100 dark:bg-muted ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8">
                        <div className="w-full mb-2 flex flex-col md:flex-row gap-4">
                            {/* Schedules first */}
                            <WeeklyDefenseSchedulesWidget
                                weekDays={weekDays}
                                selectedDay={selectedDay}
                                setSelectedDay={setSelectedDay}
                                approvedDefenses={approvedDefenses as DefenseRequest[]}
                                referenceDate={new Date()}
                                loading={loading}
                                studentId={user?.id}
                            />
                            <DefenseStatusWidget
                                recentRequests={allRequests}
                                loading={loading}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {/*put here your other widgets if you create one please*/}
                        </div>
                    </div>
        </UnifiedDashboardLayout>
    );
}

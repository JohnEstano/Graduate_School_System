import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Users, CalendarDays, ClipboardList, DollarSign, CircleEllipsis } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QuickActionsWidget from '../widgets/quick-actions-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    stats?: {
        pending_applications: number;
        pending_defense_requests: number;
        pending_payments: number;
        upcoming_deadlines: number;
        pending_honorariums?: number;
        todays_defenses?: number;
        payment_confirmations?: number;
    };
};

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

export default function AssistantDashboard() {
    const {
        auth: { user },
        stats = {
            pending_applications: 0,
            pending_defense_requests: 0,
            pending_payments: 0,
            upcoming_deadlines: 0
        }
    } = usePage<PageProps>().props;

    const [loading, setLoading] = useState(false);
    const [pendingHonorariums, setPendingHonorariums] = useState<number | null>(stats.pending_honorariums ?? null);
    const [todaysDefenses, setTodaysDefenses] = useState<number | null>(stats.todays_defenses ?? null);
    const [pendingApplications, setPendingApplications] = useState<number>(stats.pending_applications ?? 0);
    const [pendingPayments, setPendingPayments] = useState<number>(stats.pending_payments ?? 0);

    const [allRequests, setAllRequests] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
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
        // If server-side props already include the AA-specific metrics, skip fetching.
        if (pendingHonorariums !== null && todaysDefenses !== null) return;

        setLoading(true);
        Promise.all([
            fetch('/api/assistant/pending-honorariums').then(res => res.ok ? res.json() : { pending_count: 0 }).catch(() => ({ pending_count: 0 })),
            fetch('/api/todays-defenses').then(res => res.ok ? res.json() : { count: 0 }).catch(() => ({ count: 0 })),
            fetch('/api/pending-applications').then(res => res.ok ? res.json() : { count: 0 }).catch(() => ({ count: 0 })),
            fetch('/api/pending-payments').then(res => res.ok ? res.json() : { count: 0 }).catch(() => ({ count: 0 })),
            fetch('/defense-requests', { headers: { 'Accept': 'application/json' } }).then(res => res.ok ? res.json() : []).catch(() => []),
        ])
            .then(([honorariums, defenses, applications, payments, allDefenseRequests]) => {
                setPendingHonorariums(honorariums.pending_count ?? 0);
                setTodaysDefenses(defenses.count ?? 0);
                setPendingApplications(applications.count ?? 0);
                setPendingPayments(payments.count ?? 0);

                const requests = Array.isArray(allDefenseRequests)
                    ? allDefenseRequests
                    : (allDefenseRequests.defenseRequests ?? []);
                setAllRequests(requests);

                const pending = requests.filter(
                    (r: any) => (r.normalized_status || r.status) === 'Pending'
                );
                setPendingRequests(pending);
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [tab, setTab] = useState("overview");

    const metrics = [
        {
            title: "Pending Honorariums",
            value: pendingHonorariums ?? 0,
            description: "Honorariums not yet processed",
            icon: <DollarSign />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
            iconColorClass: "text-rose-500"
        },
        {
            title: "Today's Defense Schedules",
            value: todaysDefenses ?? 0,
            description: "Defenses scheduled for today",
            icon: <CalendarDays />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
            iconColorClass: "text-violet-500"
        },
        {
            title: "Pending Applications",
            value: pendingApplications,
            description: "Applications awaiting review",
            icon: <ClipboardList />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
            iconColorClass: "text-rose-500"
        },
        {
            title: "Payment Confirmations",
            value: pendingPayments,
            description: "Payments require verification",
            icon: <CircleEllipsis />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
            iconColorClass: "text-violet-500"
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto bg-white dark:bg-background">
            {loading ? (
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            ) : (
                <>
                    {/* Header - Mobile Responsive */}
                    <div className="mb-4 md:mb-7 mt-2 md:mt-3 pt-2 md:pt-3 px-4 md:px-7">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 relative overflow-hidden">
                            <div className="flex flex-col">
                                <span className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 md:mb-2 relative z-10">
                                    {isDaytime() ? (
                                        <Sun className="mr-1 size-3 md:size-4 text-rose-500" />
                                    ) : (
                                        <Moon className="mr-1 size-3 md:size-4 text-rose-500" />
                                    )}
                                    {getFormattedDate()}
                                </span>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white relative z-10">
                                    Hi, {user?.name}!
                                </h1>
                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 relative z-10">
                                    {user?.role ?? 'Assistant'}
                                </span>
                            </div>
                            {/* Quick Actions - Hidden on mobile, shown on md+ */}
                            <div className="hidden md:flex items-center">
                                <div className="h-12 w-px mx-4 bg-gray-300 dark:bg-gray-700 opacity-60" />
                                <div className="mr-8">
                                    <QuickActionsWidget userRole={user?.role} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Mobile Responsive */}
                    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-7">
                        <Tabs value={tab} onValueChange={setTab} className="w-full">
                            <TabsList className="mb-2 ">
                                <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="w-full">
                                {/* Metric Cards - Mobile Optimized */}
                                <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-0 mb-4 md:mb-6">
                                    {metrics.map((metric, idx) => (
                                        <Card
                                            key={idx}
                                            className="col-span-1 rounded-lg md:rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between p-0 min-h-0 h-auto transition hover:shadow-md"
                                            style={{ minWidth: 0 }}
                                        >
                                            <div className="flex items-center justify-between px-4 md:px-5 pt-3 md:pt-4 pb-0">
                                                <div className="text-xs md:text-sm font-extrabold text-gray-800 dark:text-zinc-100 leading-tight">
                                                    {metric.title}
                                                </div>
                                                <div className={`rounded-full p-1 md:p-1.5 flex items-center justify-center flex-shrink-0 ${metric.iconTheme}`}>
                                                    {React.cloneElement(metric.icon, { className: "size-3 md:size-4 font-extrabold " + metric.iconColorClass })}
                                                </div>
                                            </div>
                                            <div className="flex flex-col px-4 md:px-5 pb-3 md:pb-4 pt-1 md:pt-2">
                                                <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-none">
                                                    {metric.value}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                                    {metric.description}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Widgets Body - Mobile Responsive */}
                                <div className="flex flex-col gap-4 md:gap-6 bg-gray-100 dark:bg-muted rounded-lg md:rounded-xl mt-2 mb-2 px-3 md:px-4 py-4 md:py-8 w-full">
                                    <div className="w-full mb-2 flex flex-col gap-4">
                                        <WeeklyDefenseSchedulesWidget
                                            weekDays={weekDays}
                                            selectedDay={selectedDay}
                                            setSelectedDay={setSelectedDay}
                                            approvedDefenses={allRequests}
                                            referenceDate={new Date()}
                                            loading={loading}
                                        />
                                        <PendingDefenseRequestsWidget pendingRequests={pendingRequests} loading={loading} />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon } from 'lucide-react';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import { Skeleton } from "@/components/ui/skeleton";
import { Card} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import DefenseCountLineChart from '../widgets/visual-charts/defense-count';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
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

// Helper: Get unique panelists from defense requests
function getPanelistStats(defenseRequests: any[]) {
    const panelistSet = new Set<string>();
    let assignedCount = 0;

    defenseRequests.forEach((req: any) => {
        if (Array.isArray(req.panelists)) {
            req.panelists.forEach((p: any) => {
                if (p?.id) {
                    panelistSet.add(p.id);
                    assignedCount++;
                }
            });
        }
    });

    return {
        totalPanelists: panelistSet.size,
        assignedPanelists: assignedCount,
    };
}

// Helper: Count today's scheduled defenses
function getTodaysSchedules(defenseRequests: any[]) {
    const today = new Date();
    return defenseRequests.filter((dr: any) => {
        if (!dr.scheduled_date) return false;
        const eventDate = new Date(dr.scheduled_date);
        return (
            eventDate.getFullYear() === today.getFullYear() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getDate() === today.getDate()
        );
    }).length;
}

export default function DeanDashboard() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    const [allRequests, setAllRequests] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [panelistsCount, setPanelistsCount] = useState<number>(0);
    const [advisersCount, setAdvisersCount] = useState<number>(0);
    const [assignedProgramsCount, setAssignedProgramsCount] = useState<number>(0);

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
        // Fetch all defense requests (not just assigned to user)
        fetch('/defense-requests', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                const requests = Array.isArray(data)
                    ? data
                    : (data.defenseRequests ?? []);
                setAllRequests(requests);

                const pending = requests.filter(
                    (r: any) => (r.normalized_status || r.status) === 'Pending'
                );
                setPendingRequests(pending);
            })
            .catch(() => {
                setAllRequests([]);
                setPendingRequests([]);
            })
            .finally(() => setLoading(false));

        // Fetch all panelists in the database
        fetch('/api/panelists', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setPanelistsCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setPanelistsCount(0));

        // Fetch all advisers in the database
        fetch('/api/advisers', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setAdvisersCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setAdvisersCount(0));

        // Fetch all programs in the database
        fetch('/api/programs', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setAssignedProgramsCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setAssignedProgramsCount(0));
    }, []);

    const todaysSchedules = getTodaysSchedules(allRequests);

    // Metric cards (overall, not just assigned to user)
    const metrics = [
        {
            title: "Pending Defense Requests",
            value: pendingRequests.length,
            description: "Awaiting coordinator action",
            icon: <ClipboardList className="size-5 text-rose-500" />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Today's Defense Schedules",
            value: todaysSchedules,
            description: "Defenses scheduled for today",
            icon: <CalendarDays className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Pending Honorariums",
            value: 7, // Replace with real value if available
            description: "Honorariums not yet processed",
            icon: <BadgeDollarSign className="size-5 text-rose-400" />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Programs",
            value: assignedProgramsCount,
            description: "Total programs",
            icon: <ClipboardList className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Advisers",
            value: advisersCount,
            description: "Total advisers",
            icon: <Users className="size-5 text-rose-400" />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Panelists",
            value: (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {panelistsCount}
                </span>
            ),
            description: "Total panelists",
            icon: <Users className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
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
                    {/* Header */}
                    <div className="mb-7 mt-3 pt-3 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
                        <div className="flex flex-col pr-8 pl-7">
                            <span className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 relative z-10">
                                {isDaytime() ? (
                                    <Sun className="mr-1 size-4 text-rose-500" />
                                ) : (
                                    <Moon className="mr-1 size-4 text-rose-500" />
                                )}
                                {getFormattedDate()}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white relative z-10">
                                Hi, {user?.name}!
                            </h1>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 relative z-10">
                                {user?.role ?? 'Dean'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <div className="h-12 w-px mx-4 bg-gray-300 dark:bg-gray-700 opacity-60" />
                            <div className="mr-8">
                                <QuickActionsWidget userRole={user?.role} />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="w-full max-w-screen-xl mx-auto px-7">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="mb-2">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="w-full">
                                {/* Metric Cards */}
                                <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0 mb-6">
                                    {metrics.map((metric, idx) => (
                                        <Card
                                            key={idx}
                                            className="col-span-1 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between p-0 min-h-0 h-auto transition hover:shadow-md"
                                            style={{ minWidth: 0 }}
                                        >
                                            <div className="flex items-center justify-between px-5 pt-4 pb-0">
                                                <div className="text-sm font-extrabold text-gray-800 dark:text-zinc-100">
                                                    {metric.title}
                                                </div>
                                                <div className={`rounded-full p-1.5 flex items-center justify-center ${metric.iconTheme}`}>
                                                    {React.cloneElement(metric.icon, { className: "size-4 font-extrabold " + (metric.iconTheme?.split(" ").find(c => c.startsWith("text-")) ?? "") })}
                                                </div>
                                            </div>
                                            <div className="flex flex-col px-5 pb-4 pt-2">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                                                    {metric.value}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                                    {metric.description}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Widgets Body */}
                                <div className="flex flex-col gap-6 bg-gray-100 dark:bg-muted rounded-xl mt-2 mb-2 px-4 py-8 w-full">
                                    <div className="w-full mb-2 flex flex-col md:flex-row gap-4">
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

                            {/* Analytics Tab */}
                            <TabsContent value="analytics" className="w-full">
                                <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <DefenseCountLineChart />
                                    {/* Add more analytics widgets here later */}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    );
}
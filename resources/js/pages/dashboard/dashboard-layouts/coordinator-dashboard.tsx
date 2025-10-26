import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DefenseRequest } from '@/types';
import { Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import DefenseCountLineChart from '../widgets/visual-charts/defense-count';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Make sure ScrollBar is imported
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CoordinatorMostActivePrograms } from '../widgets/visual-charts/coordinator-most-active-programs';
import { CoordinatorAdviserStudentRatio } from '../widgets/visual-charts/coordinator-adviser-student-ratio';
import { CoordinatorDefenseScheduleTrends } from '../widgets/visual-charts/coordinator-defense-schedule-trends';

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
function getPanelistStats(defenseRequests: DefenseRequest[]) {
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
function getTodaysSchedules(defenseRequests: DefenseRequest[]) {
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

export default function CoordinatorDashboard() {
    const {
        auth: { user },
        panelists, // <-- Add this line to get panelists from Inertia props if available
    } = usePage<PageProps & { panelists?: any[] }>().props;

    const [allRequests, setAllRequests] = useState<DefenseRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<DefenseRequest[]>([]);
    const [todayEvents, setTodayEvents] = useState<DefenseRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Add this state for real panelists count
    const [realPanelistsCount, setRealPanelistsCount] = useState<number>(0);

    const [assignedPanelists, setAssignedPanelists] = useState<number>(0);

    // Advisers linked to this coordinator
    const [advisersCount, setAdvisersCount] = useState<number>(0);

    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

    // Example: Assigned programs count (replace with real API if available)
    const [assignedProgramsCount, setAssignedProgramsCount] = useState<number>(0);

    // Add state for AA payment verifications
    const [aaVerifications, setAaVerifications] = useState<any[]>([]);
    const [pendingHonorariumsCount, setPendingHonorariumsCount] = useState<number>(0);

    const weekDays = [
        { label: 'Sun', value: 0 },
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 3 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 5 },
        { label: 'Sat', value: 6 },
    ];

    const [tab, setTab] = useState("overview");

    useEffect(() => {
        fetch('/defense-requests', {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then((data) => {
                const requests = Array.isArray(data)
                    ? data
                    : (data.defenseRequests ?? []);
                setAllRequests(requests);

                // Prefer normalized_status when available, fallback to status
                const pending = requests.filter(
                    (r: any) => (r.normalized_status || r.status) === 'Pending'
                );
                setPendingRequests(pending);

                const today = new Date();
                const closeEvents = requests.filter((dr: any) => {
                    if (!dr.scheduled_date) return false;
                    const eventDate = new Date(dr.scheduled_date);
                    const diff = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff < 3;
                });
                setTodayEvents(closeEvents);
            })
            .catch(() => {
                setAllRequests([]);
                setPendingRequests([]);
                setTodayEvents([]);
            })
            .finally(() => setLoading(false));

        // Fetch real panelists count from API
        fetch('/api/panelists/count', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : { count: 0 })
            .then((data) => {
                setRealPanelistsCount(data.count ?? 0);
            })
            .catch(() => setRealPanelistsCount(0));

        // Fetch assigned panelists count
        fetch('/api/assigned-panelists/count', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : { assignedPanelists: 0 })
            .then((data) => {
                setAssignedPanelists(data.assignedPanelists ?? 0);
            })
            .catch(() => setAssignedPanelists(0));

        // Fetch advisers for this coordinator and set count
        fetch('/api/coordinator/advisers', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                const list = Array.isArray(data) ? data : (data.advisers ?? data);
                setAdvisersCount(list.length ?? 0);
            })
            .catch(() => setAdvisersCount(0));

        // Example fetch for assigned programs (replace endpoint as needed)
        fetch('/api/coordinator/programs', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                // Assume array of programs
                setAssignedProgramsCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setAssignedProgramsCount(0));

       fetch('/api/coordinator/pending-honorariums', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : { pending_count: 0 })
            .then((data) => setPendingHonorariumsCount(data.pending_count ?? 0))
            .catch(() => setPendingHonorariumsCount(0));
    }, []);

    // Dynamic metrics
    const { assignedPanelists: assignedPanelistsCount } = getPanelistStats(allRequests);
    const todaysSchedules = getTodaysSchedules(allRequests);

    // Panelists count: use panelists from props if available, otherwise fallback to assignedPanelistsCount
    const panelistsCount = Array.isArray(panelists) ? panelists.length : 0;

    // Organize metrics for coordinator priorities
    const metrics = [
        {
            title: "Pending Defense Requests",
            value: pendingRequests.length,
            description: "Awaiting coordinator action",
            icon: <ClipboardList className="size-5 text-rose-500" />, // Will override color below
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Today's Defense Schedules",
            value: todaysSchedules,
            description: "Defenses scheduled for today",
            icon: <CalendarDays className="size-5 text-blue-500" />,
            iconTheme: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
        },
        {
            title: "Pending Honorariums",
            value: pendingHonorariumsCount,
            description: "AA verifications pending",
            icon: <BadgeDollarSign className="size-5 text-amber-500" />,
            iconTheme: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
        },
        {
            title: "Assigned Programs",
            value: assignedProgramsCount,
            description: "Programs you coordinate",
            icon: <ClipboardList className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Advisers",
            value: advisersCount,
            description: "Total advisers linked to you",
            icon: <Users className="size-5 text-green-500" />,
            iconTheme: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
        },
        {
            title: "Panelists",
            value: (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {panelistsCount}
                </span>
            ),
            description: "Panelists assigned",
            icon: <Users className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
    ];

    // Use the same sizing and layout as student-dashboard for metric cards
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
                                    {user?.role ?? 'Student'}
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
                    <div className="w-full px-4 md:px-7">
                        <Tabs value={tab} onValueChange={setTab} className="">
                            <TabsList className="mb-2 ">
                                <TabsTrigger value="overview" className="flex-1 ">Overview</TabsTrigger>
                                <TabsTrigger value="analytics" className="flex-1 ">Analytics</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="w-full">
                                {/* Metric Cards - Mobile Optimized */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-0 mb-4 md:mb-6">
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
                                                    {React.cloneElement(metric.icon, { className: "size-3 md:size-4 font-extrabold " + (metric.iconTheme?.split(" ").find(c => c.startsWith("text-")) ?? "") })}
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

                            {/* Analytics Tab - Mobile Responsive */}
                            <TabsContent value="analytics" className="w-full">
                                {/* Bento Grid Layout - Power BI Style */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
                                    {/* Defense Schedule Trends - Spans 2 columns on desktop */}
                                    <div className="col-span-1 md:col-span-2">
                                        <CoordinatorDefenseScheduleTrends />
                                    </div>
                                    
                                    {/* Legacy Defense Count - Spans 2 columns on desktop */}
                                    <div className="col-span-1 md:col-span-2">
                                        <DefenseCountLineChart />
                                    </div>
                                    
                                    {/* Most Active Programs - Single column */}
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <CoordinatorMostActivePrograms />
                                    </div>
                                    
                                    {/* Adviser-Student Ratio - Single column */}
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <CoordinatorAdviserStudentRatio />
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
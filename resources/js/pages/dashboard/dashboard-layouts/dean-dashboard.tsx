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
import PanelAssignedRadial from '../widgets/visual-charts/panel-assigned-count';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentsPerProgramBarChart } from "../widgets/visual-charts/students-per-program-count";
import { NumberOfStudentsLineChart } from "../widgets/visual-charts/number-of-students-line-chart";

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    stats?: {
        total_programs: number;
        pending_approvals: number;
        faculty_count: number;
        graduate_students: number;
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

export default function DeanDashboard() {
    const {
        auth: { user },
        stats = {
            total_programs: 0,
            pending_approvals: 0,
            faculty_count: 0,
            graduate_students: 0
        }
    } = usePage<PageProps>().props;

    const [allRequests, setAllRequests] = useState<DefenseRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<DefenseRequest[]>([]);
    const [todayEvents, setTodayEvents] = useState<DefenseRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Add this state for real panelists count
    const [realPanelistsCount, setRealPanelistsCount] = useState<number>(0);

    const [assignedPanelists, setAssignedPanelists] = useState<number>(0);

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
    }, []);

    // Dynamic metrics
    const { assignedPanelists: assignedPanelistsCount } = getPanelistStats(allRequests);
    const todaysSchedules = getTodaysSchedules(allRequests);

    const metrics = [
        {
            title: "Panelists Assignment",
            value: (
                <span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{assignedPanelistsCount}</span>
                    <span className="text-base font-semibold text-gray-400 dark:text-gray-500 ml-1">/ {realPanelistsCount}</span>
                </span>
            ),
            description: "Panelists assigned",
            icon: <Users className="size-7" />,
        },
        {
            title: "Today's Schedules",
            value: todaysSchedules,
            description: "Defenses scheduled for today",
            icon: <CalendarDays className="size-7" />,
        },
        {
            title: "Pending Defense Requests",
            value: pendingRequests.length,
            description: "Awaiting coordinator action",
            icon: <ClipboardList className="size-7" />,
        },
        {
            title: "Pending Honorariums",
            value: 7, // leave static for now
            description: "Honorariums not yet processed",
            icon: <BadgeDollarSign className="size-7" />,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto bg-white dark:bg-background">
            {/* Skeleton Loader */}
            {loading ? (
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    {/* Top short row */}
                    <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    {/* Main rows */}
                    <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    {/* Big rectangle for dashboard body */}
                    <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="mb-7 mt-3 pt-3 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
                        <div className="flex flex-col pr-8 pl-7">
                            <span className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 relative z-10">
                                {isDaytime() ? (
                                    <Sun className="mr-1 size-4 text-yellow-500" />
                                ) : (
                                    <Moon className="mr-1 size-4 text-blue-500" />
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
                            {/*  
                            <div className="mr-8"> 
                                <QuickActionsWidget userRole={user?.role} />
                            </div>
                            */ }
                        </div>
                    </div>

                    {/* Tabs for Overview and Detailed Statistics */}
                    <Tabs defaultValue="overview" className="w-full px-7">
                        <TabsList className="mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="detailed">Detailed Statistics</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            {/* Metrics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                <DefenseCountLineChart />
                                {metrics.slice(0, 2).map((metric, idx) => (
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
                                            <div className="text-3xl font-bold leading-tight">{metric.value}</div>
                                            <div className="text-sm mt-1 mb-2 text-muted-foreground">{metric.description}</div>
                                        </div>
                                        <CardContent className="flex-1 flex items-end w-full p-0">
                                            <div className="flex items-center justify-end w-full pr-6 pb-4">
                                                {React.cloneElement(metric.icon, { className: "text-rose-500 dark:text-rose-400 size-7" })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Card className="col-span-1 rounded-2xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
                                    <div className="flex items-center justify-between px-6 pt-5">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Pending Defense Requests
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
                                        <div className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                                            {pendingRequests.length}
                                        </div>
                                        <div className="text-sm mt-1 mb-2 text-muted-foreground">
                                            Awaiting coordinator action
                                        </div>
                                    </div>
                                    <CardContent className="flex-1 flex items-end w-full p-0">
                                        <div className="flex items-center justify-end w-full pr-6 pb-4">
                                            <ClipboardList className="text-rose-500 dark:text-rose-400 size-7" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Widgets Body */}
                            <div className="flex flex-col gap-6 bg-gray-100 dark:bg-muted ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8">
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
                        <TabsContent value="detailed">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StudentsPerProgramBarChart />
                                <NumberOfStudentsLineChart />
                                {/* Add more detailed metric charts here as needed */}
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}

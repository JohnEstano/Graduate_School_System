import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Users, CalendarDays, ClipboardList } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import ImmediateActionDefenseRequestsWidget from '../widgets/immediate-action-defense-requests-widget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedDashboardLayout from '../components/unified-dashboard-layout';
import type { DefenseRequest } from '@/types';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
};



export default function FacultyDashboard() {
    const {
        auth: { user },
        studentsCount = 0, // <-- get from props
    } = usePage<PageProps>().props;

    const [allRequests, setAllRequests] = useState<DefenseRequest[]>([]);
    const [immediateRequests, setImmediateRequests] = useState<DefenseRequest[]>([]);
    const [todayEvents, setTodayEvents] = useState<DefenseRequest[]>([]);
    const [loading, setLoading] = useState(true);

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
        fetch('/adviser/defense-requests', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.json())
            .then((data) => {
                const list = (data && data.items) ? data.items : [];
                setAllRequests(list);
                const needs = list.filter((r: any) => {
                    const wf = (r.workflow_state || '').toLowerCase();
                    return ['','submitted','pending','adviser-pending','adviser-review'].includes(wf);
                });
                setImmediateRequests(needs);
                const todayStr = new Date().toISOString().slice(0,10);
                setTodayEvents(list.filter((r:any)=> (r.scheduled_date === todayStr)));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    type Metric = {
        title: string;
        value: React.ReactNode;
        description: string;
        icon: React.ReactElement;
    };

    const metrics: Metric[] = [
        {
            title: "Pending Defense Submissions",
            value: immediateRequests.length,
            description: "Submitted requirements needing your review",
            icon: <ClipboardList className="text-rose-500 size-7" />,
        },
        {
            title: "Today's Schedules",
            value: todayEvents.length,
            description: "Events scheduled for today",
            icon: <CalendarDays className="text-rose-500 size-7" />,
        },
        {
            title: "Students",
            value: studentsCount as number, // <-- use actual count
            description: "Total students linked to you",
            icon: <Users className="text-rose-500 size-7" />,
        },
    ];

    if (loading) {
        return (
            <UnifiedDashboardLayout user={user}>
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-7">
                {metrics.map((metric, idx) => (
                    <Card
                        key={idx}
                        className="border border-1 bg-white dark:bg-muted rounded-xl shadow-none flex flex-row items-center min-h-[70px] py-4 px-5 w-full"
                    >
                        <div className="flex flex-col justify-center flex-1">
                            <CardHeader className="pb-1 px-0">
                                <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-300">{metric.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 py-0">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{metric.value}</span>
                                <div className="text-[11px] text-gray-400 mt-0.5">{metric.description}</div>
                            </CardContent>
                        </div>
                        <div className="flex items-center justify-center ml-3 w-[40px] h-[40px]">
                            {metric.icon}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Widgets Body */}
            <div className="flex flex-col gap-6 bg-gray-100 ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8 dark:bg-zinc-900">
                <div className="w-full mb-2 flex flex-col md:flex-row gap-4">
                    <ImmediateActionDefenseRequestsWidget
                        requests={immediateRequests}
                        loading={loading}
                    />
                    <WeeklyDefenseSchedulesWidget
                        weekDays={weekDays}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        approvedDefenses={allRequests}
                        referenceDate={new Date()}
                        loading={loading}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  
                </div>
            </div>
        </UnifiedDashboardLayout>
    );
}

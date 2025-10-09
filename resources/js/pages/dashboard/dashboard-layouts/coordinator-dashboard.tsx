import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DefenseRequest } from '@/types';
import { Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedDashboardLayout from '../components/unified-dashboard-layout';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
};



export default function CoordinatorDashboard() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    const [allRequests, setAllRequests] = useState<DefenseRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<DefenseRequest[]>([]);
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
    }, []);

    const metrics = [

        {
            title: "Today's Schedules",
            value: todayEvents.length,
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
            value: 0, // TODO: Connect to real honorarium data when available
            description: "Honorariums not yet processed",
            icon: <BadgeDollarSign className="size-7" />,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-7">
                {metrics.map((metric, idx) => (
                    <Card key={idx} className="border border-1 bg-white dark:bg-muted rounded-xl shadow-none flex flex-row items-center min-h-[70px] py-4 px-5">
                        <div className="flex flex-col justify-center flex-1">
                            <CardHeader className="pb-1 px-0">
                                <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-300">{metric.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 py-0">
                                <div className="mb-0.5">
                                    {idx === 0 ? metric.value : (
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{metric.value}</span>
                                    )}
                                </div>
                                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{metric.description}</div>
                            </CardContent>
                        </div>
                        <div className="flex items-center justify-center ml-3 w-[40px] h-[40px]">
                            {React.cloneElement(metric.icon, { className: "text-rose-500 dark:text-rose-400 size-7" })}
                        </div>
                    </Card>
                ))}
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

                <div className="grid gap-4 md:grid-cols-2">
                    
                </div>
            </div>
        </UnifiedDashboardLayout>
    );
}

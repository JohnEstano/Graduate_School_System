import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DefenseRequest } from '@/types';
import { usePage } from '@inertiajs/react';
import { CalendarDays, ClipboardList, Moon, Sun, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ImmediateActionDefenseRequestsWidget from '../widgets/immediate-action-defense-requests-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';

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

export default function AdviserDashboard() {
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
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                const list = data && data.items ? data.items : [];
                setAllRequests(list);
                const needs = list.filter((r: any) => {
                    const wf = (r.workflow_state || '').toLowerCase();
                    return ['', 'submitted', 'pending', 'adviser-pending', 'adviser-review'].includes(wf);
                });
                setImmediateRequests(needs);
                const todayStr = new Date().toISOString().slice(0, 10);
                setTodayEvents(list.filter((r: any) => r.scheduled_date === todayStr));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Metric cards styled like coordinator dashboard
    const metrics = [
        {
            title: 'Pending Defense Submissions',
            value: immediateRequests.length,
            description: 'Submitted requirements needing your review',
            icon: <ClipboardList className="size-5 text-rose-500" />,
            iconTheme: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300',
        },
        {
            title: "Today's Schedules",
            value: todayEvents.length,
            description: 'Events scheduled for today',
            icon: <CalendarDays className="size-5 text-blue-500" />,
            iconTheme: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        },
        {
            title: 'Students',
            value: studentsCount as number,
            description: 'Total students linked to you',
            icon: <Users className="size-5 text-green-500" />,
            iconTheme: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        },
    ];

    return (
        <div className="dark:bg-background flex h-full flex-1 flex-col gap-4 overflow-auto bg-white">
            {/* Skeleton Loader */}
            {loading ? (
                <div className="m-0 flex min-h-[70vh] w-full flex-col gap-4 bg-zinc-100 p-0 dark:bg-zinc-900">
                    {/* Top short row */}
                    <Skeleton className="mx-8 mt-8 h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800" />
                    {/* Main rows */}
                    <Skeleton className="mx-8 h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800" />
                    <Skeleton className="mx-8 h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800" />
                    {/* Big rectangle for dashboard body */}
                    <Skeleton className="mt-4 h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800" />
                </div>
            ) : (
                <>
                    {/* Header - Mobile Responsive */}
                    <div className="mt-4 mb-4 px-4 md:mt-5 md:mb-7 md:px-7">
                        <div className="relative flex flex-col gap-4 overflow-hidden md:flex-row md:items-center md:justify-between md:gap-0">
                            <div className="flex flex-col">
                                <span className="relative z-10 mb-1 flex items-center text-xs font-semibold text-gray-700 md:mb-2 dark:text-gray-200">
                                    {isDaytime() ? (
                                        <Sun className="mr-1 size-3 text-rose-500 md:size-4" />
                                    ) : (
                                        <Moon className="mr-1 size-3 text-rose-500 md:size-4" />
                                    )}
                                    {getFormattedDate()}
                                </span>
                                <h1 className="relative z-10 text-xl font-bold text-gray-900 md:text-2xl lg:text-3xl dark:text-white">
                                    Hi, {user?.name}!
                                </h1>
                                <span className="relative z-10 mt-1 text-xs text-gray-400 dark:text-gray-500">{user?.role ?? 'Adviser'}</span>
                            </div>
                            {/* Quick Actions - Hidden on mobile, shown on md+ */}
                            <div className="hidden items-center md:flex">
                                <div className="mx-4 h-12 w-px bg-gray-300 opacity-60 dark:bg-gray-700" />
                                <div className="mr-8">
                                    <QuickActionsWidget userRole={user?.role} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metric Cards - Mobile Optimized */}
                    <div className="mx-auto mb-4 grid w-full max-w-screen-xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 md:mb-6 md:gap-4 md:px-7 lg:grid-cols-3">
                        {metrics.map((metric, idx) => (
                            <Card
                                key={idx}
                                className="col-span-1 flex h-auto min-h-0 flex-col justify-between rounded-lg border border-gray-200 bg-white p-0 shadow-sm transition hover:shadow-md md:rounded-xl dark:border-zinc-800 dark:bg-zinc-900"
                                style={{ minWidth: 0 }}
                            >
                                <div className="flex items-center justify-between px-4 pt-3 pb-0 md:px-5 md:pt-4">
                                    <div className="text-xs leading-tight font-extrabold text-gray-800 md:text-sm dark:text-zinc-100">
                                        {metric.title}
                                    </div>
                                    <div className={`flex flex-shrink-0 items-center justify-center rounded-full p-1 md:p-1.5 ${metric.iconTheme}`}>
                                        {React.cloneElement(metric.icon, {
                                            className:
                                                'size-3 md:size-4 font-extrabold ' +
                                                (metric.iconTheme?.split(' ').find((c) => c.startsWith('text-')) ?? ''),
                                        })}
                                    </div>
                                </div>
                                <div className="flex flex-col px-4 pt-1 pb-3 md:px-5 md:pt-2 md:pb-4">
                                    <span className="text-xl leading-none font-bold text-gray-900 md:text-2xl dark:text-white">{metric.value}</span>
                                    <span className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">{metric.description}</span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Widgets Body - Mobile Responsive */}
                    <div className="mx-2 mt-2 mb-2 flex flex-col gap-4 rounded-lg bg-gray-100 px-3 py-4 md:mx-4 md:gap-6 md:rounded-xl md:px-5 md:py-8 dark:bg-zinc-900">
                        <div className="mb-2 flex w-full flex-col gap-4">
                            <ImmediateActionDefenseRequestsWidget requests={immediateRequests} loading={loading} />
                            <WeeklyDefenseSchedulesWidget
                                weekDays={weekDays}
                                selectedDay={selectedDay}
                                setSelectedDay={setSelectedDay}
                                approvedDefenses={allRequests}
                                referenceDate={new Date()}
                                loading={loading}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">{/* Add more widgets here if needed */}</div>
                    </div>
                </>
            )}
        </div>
    );
}

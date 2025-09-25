import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import DefenseStatusWidget from '../widgets/defense-status-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import ExamEligibilityWidget from '../widgets/exam-eligibility-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DefenseRequest } from '@/types';

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
        } | null;
    };
    defenseRequirement?: DefenseRequirement;
    defenseRequest?: DefenseRequest;
    defenseRequests?: DefenseRequest[];
    recentPayment?: RecentPayment;
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

export default function StudentDashboard() {
    const page = usePage<PageProps>().props;
    const { auth: { user }, defenseRequirement, defenseRequest } = page;
    const serverDefenseRequests = page.defenseRequests ?? [];

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
    // If not, you may need to fetch payments and get the latest one

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

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5">
            {/* Header */}
            <div className="mb-7 mt-3 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
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
                        {user?.role ?? 'Student'}
                        {user?.school_id && (
                            <>
                                <span className="mx-1">/</span>
                                <span className="text-rose-500 font-bold">{user.school_id}</span>
                            </>
                        )}
                    </span>
                </div>
                <div className="flex items-center">
                    <div className="h-12 w-px mx-4 bg-gray-300 dark:bg-gray-700 opacity-60" />
                    <div className="mr-8">
                        <QuickActionsWidget userRole={user?.role} />
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-7">
                {metrics.map((metric, idx) => (
                    <Card key={idx} className="border border-1 bg-white dark:bg-muted rounded-xl shadow-none flex flex-row items-center min-h-[70px] py-4 px-5">
                        <div className="flex flex-col justify-center flex-1">
                            <CardHeader className="pb-1 px-0">
                                <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-300">{metric.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 py-0">
                                <div className="mb-0.5">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{metric.value}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">{metric.description}</div>
                            </CardContent>
                        </div>
                        <div className="flex items-center justify-center ml-3 w-[40px] h-[40px]">
                            {React.cloneElement(metric.icon, { className: "text-rose-500 size-7" })}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Widgets Body */}
            <div className="flex flex-col gap-6 bg-gray-100 ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8">
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
        </div>
    );
}

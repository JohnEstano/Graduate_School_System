import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import DefenseStatusWidget from '../widgets/defense-status-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import ExamEligibilityWidget from '../widgets/exam-eligibility-widget';
import type { DefenseRequest } from '@/types';

type DefenseRequirement = {
    id: number;
    thesis_title: string;
    status: string;
    created_at?: string;
    // ...other fields as needed
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
    // ...other props...
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
    // server-provided list (optional) OR we'll use the locally fetched list
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
            if (mine.length === 0) mine = requests; // fallback
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
                console.error('fetch defense requests failed', e);
                setAllRequests([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.id]);

    // prefer server-provided list; if not present, fall back to locally fetched allRequests
    const approvedDefenses = (serverDefenseRequests && serverDefenseRequests.length > 0) ? serverDefenseRequests : allRequests;

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5">
            {/* Header */}
            <div className="mb-4 mt-3 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
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
                    <QuickActionsWidget />
                </div>
            </div>

            {/* Widgets Body */}
            <div className="flex flex-col gap-6 bg-gray-100 ms-4 me-4 rounded-xl mt-2  px-5 py-8">
                <div className="w-full mb-2 flex flex-col md:flex-row gap-4">
                    <DefenseStatusWidget
                        recentRequests={allRequests}
                        loading={loading}
                    />
                    <WeeklyDefenseSchedulesWidget
                        weekDays={weekDays}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        approvedDefenses={approvedDefenses as DefenseRequest[]}
                        referenceDate={new Date()}
                        loading={loading}
                        studentId={user?.id}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <RemindersWidget />
                    <UpcomingSchedulesWidget loading={loading} todayEvents={todayEvents} />
                    <ExamEligibilityWidget />
                </div>
                {/* You can add another widget here, e.g. RecentActivityWidget */}
            </div>
        </div>
    );
}

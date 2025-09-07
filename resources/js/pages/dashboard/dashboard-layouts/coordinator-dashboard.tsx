import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import { Separator } from "@/components/ui/separator";
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
            .then(res => res.json())
            .then((data) => {
                // If backend returns { defenseRequests: [...] }
                const requests = Array.isArray(data) ? data : data.defenseRequests ?? [];
                setAllRequests(requests);
                setPendingRequests(requests.filter((r: DefenseRequest) => r.status === 'Pending'));
                const today = new Date();
                const closeEvents = requests.filter((dr: DefenseRequest) => {
                    const eventDate = new Date(dr.date_of_defense);
                    const diff = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff < 3;
                });
                setTodayEvents(closeEvents);
            })
            .catch(() => {
                setAllRequests([]);
                setPendingRequests([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5">
            {/* Header */}
            <div className="mb-8 mt-3 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
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
                    </span>
                </div>
                <div className="flex items-center">
                    <div className="h-12 w-px mx-4 bg-gray-300 dark:bg-gray-700 opacity-60" />
                    <QuickActionsWidget />
                </div>
            </div>

            {/* Widgets Body */}
            <div className="flex flex-col gap-6 bg-gray-100 ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8">
                
                <div className="w-full mb-2 flex flex-col md:flex-row gap-4">
                    <PendingDefenseRequestsWidget pendingRequests={pendingRequests} loading={loading} />
                    <WeeklyDefenseSchedulesWidget
                        weekDays={weekDays}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        approvedDefenses={  allRequests}
                        referenceDate={new Date()}
                        loading={loading}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <RemindersWidget />
                    <UpcomingSchedulesWidget loading={loading} todayEvents={todayEvents} />
                </div>
            </div>
        </div>
    );
}

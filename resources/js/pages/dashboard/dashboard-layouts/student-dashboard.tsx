import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Users, CalendarDays, ClipboardList, BadgeDollarSign, ArrowRight, ArrowLeft, BookOpen, TrendingUp, UserPlus, FileText, CheckSquare, Square } from 'lucide-react';
import RemindersWidget from '../widgets/reminders-widget';
import UpcomingSchedulesWidget from '../widgets/upcomming-schedules-widget';
import DefenseStatusWidget from '../widgets/defense-status-widget';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import ExamEligibilityWidget from '../widgets/exam-eligibility-widget';
import PendingDefenseRequestsWidget from '../widgets/pending-defense-request-widget';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DefenseRequest } from '@/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import StatusDefenseWidget from '../widgets/status-defense-widget';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

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
            advisers?: any[]; // Add advisers property, adjust type if needed
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
    const [showWelcome, setShowWelcome] = useState(true);
    const [showAdviserAlert, setShowAdviserAlert] = useState(true);

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

    // --- Student Metrics Cards ---
    const metrics = [
        {
            title: "Defense Submissions",
            value: allRequests.length,
            description: "Total defense requests submitted",
            icon: <ClipboardList />, // icon only, styling below
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Today's Schedules",
            value: todayEvents.length,
            description: "Events scheduled for today",
            icon: <CalendarDays />,
            iconTheme: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
        },
        {
            title: "Recent Payment",
            value: `₱${recentPaymentAmount.toLocaleString()}`,
            description: "Most recent payment made",
            icon: <BadgeDollarSign />,
            iconTheme: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
        },
        {
            title: "Exam Eligibility",
            value: <ExamEligibilityWidget simple />,
            description: "Check if you are eligible for exams",
            icon: <Users />,
            iconTheme: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
        },
    ];

    // For horizontal scroll
    const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        if (!scrollRef) return;
        const updateScroll = () => {
            setCanScrollLeft(scrollRef.scrollLeft > 0);
            setCanScrollRight(
                scrollRef.scrollLeft + scrollRef.clientWidth < scrollRef.scrollWidth - 5
            );
        };
        scrollRef.addEventListener('scroll', updateScroll);
        updateScroll();
        return () => scrollRef.removeEventListener('scroll', updateScroll);
    }, [scrollRef]);

    const scrollByCard = (dir: "left" | "right") => {
        if (!scrollRef) return;
        const cardWidth = scrollRef.firstElementChild
            ? (scrollRef.firstElementChild as HTMLElement).offsetWidth + 16 // 16px gap
            : 300;
        scrollRef.scrollBy({ left: dir === "right" ? cardWidth : -cardWidth, behavior: "smooth" });
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto bg-white dark:bg-background">
            {/* Skeleton Loader */}
            {loading ? (
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    {/* Top short row */}
                    <div className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    {/* Main rows */}
                    <div className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <div className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    {/* Big rectangle for dashboard body */}
                    <div className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="mb-3 mt-5 flex flex-row justify-between items-center relative overflow-hidden" style={{ minHeight: '120px' }}>
                        <div className="flex flex-col pr-8 pl-7">
                            <span className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 relative z-10">
                                {isDaytime() ? (
                                    <Sun className="mr-1 size-4 text-rose-500" />
                                ) : (
                                    <Moon className="mr-1 size-4 text-rose-500" />
                                )}
                                {getFormattedDate()}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white relative z-10">
                                Hi, {user?.name}!
                            </h1>
                            <span className="text-xs text-zinc-500 font-extrabold mt-3 relative z-10">
                                {user?.role ?? 'Student'}
                                {user?.school_id && (
                                    <>
                                        <span className="mx-1">/</span>
                                        <span className="font-bold">{user.school_id}</span>
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

                    {/* ALERT: Student has not registered an adviser */}
                    {user?.advisers?.length === 0 && showAdviserAlert && (
                        <div className="mx-7 my-3">
                            <div className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start gap-3 px-6 py-5 rounded-xl relative">
                                <AlertCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="font-semibold mb-1 block">You are not registered to an adviser yet.</span>
                                    <span className="text-sm">
                                        Contact your coordinator for assistance.
                                        <Link
                                            href="/settings/profile"
                                            className="ml-2 underline text-rose-600 dark:text-rose-300 font-medium hover:text-rose-700 dark:hover:text-rose-200"
                                        >
                                            Go to Settings
                                        </Link>
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowAdviserAlert(false)}
                                    className="absolute top-3 right-4 px-2 py-1 text-base rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-200"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}



                    {/* Metrics Cards */}
                    <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-7 mb-6">
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
                                        {/* Use size-4 for icons, matching coordinator-dashboard */}
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
                        {/* StatusDefenseWidget as a card */}

                    </div>

                    {/* Widgets Body */}
                    <div className="flex flex-col gap-6 bg-gray-100 dark:bg-muted ms-4 me-4 rounded-xl mt-2 mb-2 px-5 py-8">
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
                            {/* Defense Status Widget beside the schedule widget */}
                            <DefenseStatusWidget
                                recentRequests={approvedDefenses as any}
                                loading={loading}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {/*put here your other widgets if you create one please*/}
                        </div>
                    </div>

                </>
            )}
        </div>
    );
}
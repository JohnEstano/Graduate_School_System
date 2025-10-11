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

const RESOURCES = [
    {
        title: "NFL Big Data Bowl 2026 - Analytics",
        description: "Understand player movement while competing for prizes.",
        featured: "Featured · Hackathon",
        entrants: "1777 Entrants",
        prize: "$50,000",
        time: "2 months to go",
        image: "https://static01.nfl.com/nfl-big-data-bowl.png", // Replace with your own image or static asset
    },
    {
        title: "Graduate Research Guide",
        description: "A comprehensive guide for graduate research best practices.",
        featured: "Guide · Research",
        entrants: "All Students",
        prize: "Free",
        time: "Always available",
        image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    },
    {
        title: "Scholarship Opportunities",
        description: "Find scholarships you may be eligible for.",
        featured: "Scholarship · Funding",
        entrants: "Open",
        prize: "Varies",
        time: "Rolling",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    },
    {
        title: "Thesis Formatting Workshop",
        description: "Learn how to format your thesis for submission.",
        featured: "Workshop · Academic",
        entrants: "Limited slots",
        prize: "Free",
        time: "Next week",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80",
    },
    {
        title: "Career Counseling",
        description: "Get advice on your career path after graduation.",
        featured: "Service · Counseling",
        entrants: "By appointment",
        prize: "Free",
        time: "Ongoing",
        image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    },
];

// Steps to do for student onboarding (refined for clarity and conciseness)
const STUDENT_STEPS = [
    {
        icon: <UserPlus className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />,
        title: "Register your adviser",
        description: (
            <>
                Add your adviser for your subject course Thesis and Dissertation.{" "}
                <a
                    href="/settings"
                    className="underline text-rose-600 dark:text-rose-300 font-medium hover:text-rose-700 dark:hover:text-rose-200"
                >
                    Go to settings
                </a>{" "}
                and link your adviser using their code or contact your adviser for registration.
            </>
        ),
        checked: false,
    },
    {
        icon: <FileText className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />,
        title: "Apply for Comprehensive Exam",
        description: "Check eligibility and submit your comprehensive exam application.",
        checked: false,
    },
    {
        icon: <FileText className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />,
        title: "Submit Defense Requirement",
        description: "Upload your requirements for Proposal, Prefinal, or Final defense (Masteral/Doctorate).",
        checked: false,
    },
    {
        icon: <ClipboardList className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />,
        title: "Complete Oral Defense Presentation",
        description: "Prepare and complete your oral defense presentation as scheduled.",
        checked: false,
    },
];

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
            icon: <ClipboardList className="size-4 font-extrabold text-zinc-800 dark:text-zinc-200" />, // icon extrabold, dark zinc
        },
        {
            title: "Today's Schedules",
            value: todayEvents.length,
            description: "Events scheduled for today",
            icon: <CalendarDays className="size-4 font-extrabold text-zinc-800 dark:text-zinc-200" />,
        },
        {
            title: "Recent Payment",
            value: `₱${recentPaymentAmount.toLocaleString()}`,
            description: "Most recent payment made",
            icon: <BadgeDollarSign className="size-4 font-extrabold text-zinc-800 dark:text-zinc-200" />,
        },
        {
            title: "Exam Eligibility",
            value: <ExamEligibilityWidget simple />, // Only show "Eligible" or "Not Eligible"
            description: "Check if you are eligible for exams",
            icon: <Users className="size-4 font-extrabold text-zinc-800 dark:text-zinc-200" />,
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
                                    <span className="font-semibold mb-1 block">You have not registered an adviser yet.</span>
                                    <span className="text-sm">
                                        Please register with your adviser using their code or contact your adviser for assistance.
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
                                    <div className="rounded-full bg-gray-100 dark:bg-zinc-800 p-1.5 flex items-center justify-center">
                                        {metric.icon}
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

                    
                    <div className="flex justify-center my-6">
                        <div className="w-[95%] border-t border-zinc-200 dark:border-zinc-800" />
                    </div>


                    {/* Add in this new section Steps to do! SECTION */}
                    <div className="w-full flex flex-col items-start px-0 py-0">
                        <div className="w-full py-8 px-7">
                            <div className="max-w-4xl">
                                <div className="flex items-center mb-2">
                                    <TrendingUp className="mr-5 w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Next Steps</span>
                                </div>
                                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-6">Things to do</div>
                                <div className="flex flex-col gap-2">
                                    {STUDENT_STEPS.map((step, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-4 bg-transparent rounded-lg px-2 py-3 transition"
                                        >
                                            <div className="flex-shrink-0 flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 w-10 h-10">
                                                {step.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{step.title}</div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                                    {step.description}
                                                </div>
                                            </div>
                                            <div className="flex items-center ml-2">
                                                {/* Placeholder for checkbox, logic to be implemented */}
                                                <span className="inline-flex items-center justify-center">
                                                    {step.checked ? (
                                                        <CheckSquare className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                      
                    <div className="flex justify-center my-6">
                        <div className="w-[95%] border-t border-zinc-200 dark:border-zinc-800" />
                    </div>

                    {/* Resources Section */}
                    <div className="flex items-center px-7 pt-4 pb-2">
                        <BookOpen className="mr-5 text-black" />
                        <span className="text-lg md:text-xl font-extrabold text-zinc-900 dark:text-white">Resources</span>
                    </div>
                    <div className="w-full pb-8">
                        <div className="w-full px-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {RESOURCES.map((res, idx) => (
                                    <a
                                        key={idx}
                                        href="#"
                                        tabIndex={-1}
                                        className="group cursor-pointer block"
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Card className="flex flex-col justify-between items-start border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none group-hover:shadow-md transition-shadow duration-200 w-full aspect-square min-w-[200px] max-w-[260px] min-h-[200px] max-h-[260px]">
                                            <CardHeader className="flex-1 w-full pt-6 pb-2 px-4">
                                                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white mb-1">{res.title}</CardTitle>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-300 mb-2 line-clamp-3">
                                                    {res.description}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="w-full px-4 pb-4 pt-0 flex justify-end">
                                                <span className="gap-1 text-rose-500 group-hover:text-rose-600 font-semibold flex items-center">
                                                    Visit <ArrowRight className="w-4 h-4 ml-1" />
                                                </span>
                                            </CardContent>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>



                </>
            )}
        </div>
    );
}